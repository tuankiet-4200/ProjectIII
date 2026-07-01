# CART & ORDERS - Giỏ hàng, Đặt hàng, Thanh toán

---

## 1. Chức năng tổng quan

| Module | Công nghệ | Vai trò |
|--------|-----------|---------|
| `CartService` | Redis Hash | Lưu giỏ hàng tạm thời, tốc độ cao |
| `OrdersService` | Prisma + RabbitMQ | Khởi tạo đơn, đẩy message queue |
| `OrdersProcessor` | RabbitMQ Consumer | Xử lý đơn async, transaction DB |
| `SepayCheckoutService` | SePay SDK | Tích hợp cổng thanh toán |
| `order-totals.ts` | Pure function | Tính subtotal, discount, ship, tax |

---

## 2. Luồng Giỏ hàng (Redis)

### Tại sao dùng Redis cho giỏ hàng?
- Giỏ hàng thay đổi liên tục (thêm/xóa/sửa số lượng) → cần tốc độ cao
- Không cần tính nhất quán tuyệt đối (ACID) như đơn hàng
- Redis Hash: `cart:{userId}` → `{ "productId1": "2", "productId2": "1" }`

```
User thêm sản phẩm vào giỏ
↓
POST /api/cart/items { product_id, quantity }
↓
CartService.addItem(userId, dto):
  1. prisma.product.findUnique() → kiểm tra sản phẩm tồn tại + còn hàng
  2. redis.hget("cart:{userId}", productId) → lấy số lượng hiện tại
  3. newQty = currentQty + dto.quantity
  4. Kiểm tra newQty <= stock_quantity
  5. redis.hset("cart:{userId}", productId, newQty.toString())
  6. prisma.userInteraction.create({ interaction_type: 'ADD_TO_CART' })
     ↑ Ghi nhận hành vi cho AI recommendation
↓
{ message: "Item added to cart", quantity: newQty }
```

### Đọc giỏ hàng

```
GET /api/cart
↓
CartService.getCart(userId):
  1. redis.hgetall("cart:{userId}") → { productId: quantity, ... }
  2. prisma.product.findMany({ where: { id: { in: productIds } } })
     → Lấy thông tin đầy đủ từ DB (tên, giá, ảnh, shop)
  3. Group items theo shop_id (Map<shopId, { shop, items, subtotal }>)
  4. Tính totalItems, totalAmount
↓
{ groups: [...], total_items: N, total_amount: M }
```

**Chú ý**: Giỏ hàng lưu trong Redis (tạm), thông tin sản phẩm vẫn join từ PostgreSQL. Điều này đảm bảo giá luôn là giá **mới nhất** (trước khi mua). Sau khi mua → lưu `price_at_purchase` vào OrderItem.

---

## 3. Luồng Đặt hàng (Async RabbitMQ)

### Tại sao dùng RabbitMQ?

Xử lý đơn hàng là nghiệp vụ phức tạp:
- Kiểm tra tồn kho nhiều sản phẩm
- Trừ stock (race condition nếu nhiều user cùng mua)
- Tạo ShopOrder theo từng shop
- Áp dụng coupon
- Gọi SePay API (chậm, external)

Nếu làm synchronous: Request có thể timeout, UX tệ. Với RabbitMQ:
- Request trả về **ngay lập tức** → UX tốt
- Xử lý nặng chạy **ngầm** trong background
- Kết quả thông báo qua **WebSocket**

```
User click "Đặt hàng"
↓
POST /api/orders/checkout { selected_product_ids, payment_method, shipping_address, coupon_code }
↓
OrdersService.checkout(userId, dto):
  1. redis.hgetall("cart:{userId}") → kiểm tra giỏ không rỗng
  2. Lọc sản phẩm được chọn (nếu có selected_product_ids)
  3. prisma.parentOrder.create({ total_payment: 0 }) → tạo đơn PENDING ngay
     ↑ Tại sao total = 0? Vì chưa tính xong. Processor sẽ cập nhật sau
  4. rmqClient.emit("order.create", { userId, parentOrderId, dto, cartData })
     ↑ Đẩy message vào RabbitMQ queue "orders_queue"
  5. redis.del("cart:{userId}") → xóa giỏ hàng (hoặc hdel nếu chọn từng sản phẩm)
↓
{ message: "Đơn hàng đang được xử lý", parent_order_id: "...", status: "PROCESSING" }
↓  (response trả về ngay, không đợi)
Frontend hiển thị "Đang xử lý..." và lắng nghe WebSocket
```

---

## 4. OrdersProcessor - Xử lý trong RabbitMQ Consumer

```typescript
@EventPattern('order.create')  // Lắng nghe event "order.create" từ queue
async handleOrderCreate(@Payload() data: any) {
```

**Luồng xử lý chi tiết:**

```
RabbitMQ nhận message "order.create"
↓
OrdersProcessor.handleOrderCreate():

  BƯỚC 1: Lấy sản phẩm từ DB
  prisma.product.findMany({ where: { id: { in: productIds } } })

  BƯỚC 2: Group sản phẩm theo shop
  shopGroups = Map<shopId, { shopId, items[] }>

  BƯỚC 3: Tính tổng tiền sơ bộ
  totalPayment = Σ (product.price × quantity)

  BƯỚC 4: Transaction lớn (prisma.$transaction):
    4a. Kiểm tra và áp dụng coupon:
        - Tìm coupon theo code
        - Kiểm tra is_active, expires_at, min_order_amount
        - Tính discountAmount (% hoặc fixed)
        - coupon.update({ used_count: increment(1) })
        - couponUsage.create()

    4b. calculateOrderTotals() → subtotal, discount, shipping, tax, total

    4c. parentOrder.update({ total_payment: finalTotal })

    4d. Với mỗi shop trong shopGroups:
        - shopOrder.create() → đơn con cho shop này
        - Với mỗi sản phẩm:
          * orderItem.create() → ghi item vào đơn
          * product.updateMany({
              where: { id, stock_quantity: { gte: quantity } },  ← Optimistic lock
              data: { stock_quantity: decrement(quantity), sales_count: increment(quantity) }
            })
          * Nếu updated.count === 0 → sản phẩm hết hàng → throw Error → ROLLBACK toàn bộ

  BƯỚC 5: Nếu SEPAY → tạo payment link
  sepayCheckout.createPayment({ orderId, amount, ... })

  BƯỚC 6: Thông báo thành công qua WebSocket
  notifications.server.to("user_{userId}").emit("order_checkout_success", {...})

  LỖI → xóa parentOrder + emit "order_checkout_failed" qua WebSocket
```

### Optimistic Locking cho Stock

```typescript
const updated = await tx.product.updateMany({
  where: {
    id: item.product.id,
    stock_quantity: { gte: item.quantity },  // Điều kiện: còn đủ hàng
  },
  data: {
    stock_quantity: { decrement: item.quantity },
  },
});
if (updated.count === 0) {
  throw new Error(`Sản phẩm "${item.product.name}" đã hết hàng.`);
}
```

**Tại sao không dùng `findFirst` rồi `update`?**
Nếu tách làm 2 query:
1. `findFirst` → còn 1 sản phẩm
2. User B cũng `findFirst` → cũng thấy còn 1
3. User A `update` → stock = 0
4. User B `update` → stock = -1 (❌ Race condition!)

Với `updateMany` có điều kiện `stock_quantity >= quantity` → Atomic operation ở database level → Chỉ 1 trong 2 user thành công.

---

## 5. Tính tiền - order-totals.ts

```typescript
export const FREE_SHIPPING_THRESHOLD = 200000;  // Miễn ship khi đơn >= 200k
export const STANDARD_SHIPPING_FEE = 12000;      // Phí ship cố định 12k
export const TAX_RATE = 0.035;                   // Thuế 3.5%

export function calculateOrderTotals(subtotal: number, discount = 0): OrderTotals {
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0           // Miễn ship
      : STANDARD_SHIPPING_FEE;  // Tính ship

  const tax = Math.round(subtotal * TAX_RATE);

  const total = Math.max(0,
    subtotal - discount + shipping + tax
  );

  return { subtotal, discount, shipping, tax, total };
}
```

**Chú ý**: `Math.max(0, ...)` đảm bảo total không âm dù discount cực lớn.

---

## 6. Thanh toán SePay

```
User chọn thanh toán SePay → checkout bình thường
↓
Processor xử lý xong → gọi SepayCheckoutService.createPayment()
↓
SePay SDK tạo URL thanh toán + form fields
↓
WebSocket emit { checkoutUrl, fields } về Frontend
↓
Frontend redirect user sang trang thanh toán SePay

User thanh toán xong → SePay redirect về SEPAY_SUCCESS_URL
↓
Frontend gọi POST /api/orders/{id}/confirm-payment
↓
OrdersService.confirmSepayPayment():
  1. Gọi SePay API: sepayCheckout.retrieveOrder(orderId)
  2. Kiểm tra status trong ["COMPLETED", "PAID", "SUCCESS", ...]
  3. Kiểm tra amount khớp với total_payment
  4. parentOrder.update({ payment_status: 'PAID' })
```

---

## 7. Câu hỏi bảo vệ

### Q1: Tại sao tạo parentOrder trước khi RabbitMQ xử lý xong?
**A:** Để user có ID đơn hàng ngay để theo dõi. Đơn ở trạng thái "pending" với total=0. Nếu processor fail → xóa đơn và thông báo lỗi. Đây là **optimistic creation** pattern.

### Q2: Race condition khi nhiều user mua cùng 1 sản phẩm?
**A:** Được xử lý bằng Optimistic Locking trong `updateMany` với điều kiện `stock_quantity >= quantity`. Database đảm bảo atomic — chỉ 1 transaction thành công, transaction sau thấy `updated.count === 0` và throw Error, toàn bộ transaction đó rollback.

### Q3: Nếu RabbitMQ down thì sao?
**A:** Checkout sẽ fail vì `rmqClient.emit()` throw error. ParentOrder đã tạo nhưng message không vào queue. Giải pháp cần có: retry mechanism, dead letter queue, hoặc cleanup job để xóa orphan parentOrders.

### Q4: Tại sao dùng `prisma.$transaction` trong processor?
**A:** Đảm bảo ACID:
- **Atomicity**: Tất cả hoặc không có gì (coupon + orders + stock update)
- **Consistency**: Stock không xuống âm
- **Isolation**: Các transaction song song không ảnh hưởng nhau
- **Durability**: Đã commit là lưu vĩnh viễn

### Q5: Tại sao Cart lưu Redis mà không lưu DB?
**A:** 
- Giỏ hàng là dữ liệu tạm, thay đổi rất thường xuyên
- Redis O(1) cho HGET/HSET vs PostgreSQL query
- Không cần ACID cho giỏ hàng (mất giỏ hàng khi Redis reset ≈ trade-off chấp nhận được)
- Giải pháp nâng cao: persist giỏ hàng vào DB sau N phút không hoạt động

### Q6: Coupon có bị race condition không?
**A:** Có nguy cơ. Nếu 100 user cùng dùng 1 coupon còn 1 lần dùng → nhiều transaction cùng check `used_count < usage_limit` → đều pass → nhiều lần dùng hơn giới hạn. Giải pháp: thêm điều kiện trong update và check `updated.count`:
```typescript
await tx.coupon.updateMany({
  where: { code, used_count: { lt: coupon.usage_limit } },
  data: { used_count: { increment: 1 } },
})
```

---

## 8. Tóm tắt 5 điểm chính

1. **Redis Hash** cho giỏ hàng: key=`cart:{userId}`, field=`productId`, value=`quantity`
2. **Async checkout via RabbitMQ**: Tạo đơn ngay → xử lý ngầm → thông báo WebSocket
3. **Prisma Transaction**: Toàn bộ tạo đơn (coupon + orders + stock) trong 1 transaction atomic
4. **Optimistic Locking**: `updateMany` với điều kiện `stock_quantity >= quantity` → chống oversell
5. **SePay Integration**: Tạo payment URL sau khi xử lý xong, confirm bằng cách gọi lại SePay API verify
