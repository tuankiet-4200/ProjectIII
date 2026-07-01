# DATABASE SCHEMA - Phân tích chi tiết

---

## 1. Chức năng

File `prisma/schema.prisma` là **trái tim của database**, định nghĩa toàn bộ cấu trúc dữ liệu cho hệ thống e-commerce đa nhà bán. Nó thuộc lớp **Infrastructure/Data Layer** trong kiến trúc phân tầng.

**Người dùng tương tác khi nào?**  
Mọi thao tác đều liên quan đến schema này: đăng ký tài khoản, đặt hàng, chat, đánh giá, v.v.

---

## 2. Kiến trúc Database - Sơ đồ ERD (Text)

```
User ─────────────────────────────────────────────────────────────
│  id (UUID, PK)                                                  
│  email (UNIQUE)                                                 
│  password_hash                                                  
│  full_name                                                      
│  phone (UNIQUE)                                                 
│  role: CUSTOMER | ADMIN | SHIPPER                               
│  is_banned                                                      
│                                                                 
├──► UserAddress (N)         [địa chỉ giao hàng]
├──► Shop (N)                [user là chủ shop]
├──► ParentOrder (N)         [đơn hàng của user]
├──► Review (N)              [đánh giá của user]
├──► ChatSession (N)         [phiên chat]
├──► UserInteraction (N)     [hành vi xem/mua]
├──► Wishlist (N)            [danh sách yêu thích]
├──► CouponUsage (N)         [lịch sử dùng coupon]
└──► TrackingEvent (N)       [shipper tạo event]

Shop ─────────────────────────────────────────────────────────────
│  id (UUID, PK)
│  owner_id (FK → User)
│  name, description, logo_url
│  rating: Decimal(3,2)      [điểm đánh giá TB]
│  status: PENDING|ACTIVE|REJECTED|BANNED
│  ai_auto_respond: Boolean  [bật/tắt AI chat]
│
├──► Product (N)             [sản phẩm của shop]
├──► ShopOrder (N)           [đơn hàng của shop]
├──► ChatSession (N)         [phiên chat với shop]
└──► Coupon (N)              [mã giảm giá của shop]

Category ─────────────────────────────────────────────────────────
│  id (Int, autoincrement, PK)
│  name, slug (UNIQUE), icon
│  parent_id (FK → Category, self-reference)  [danh mục cha]
│
├──► children (Category[])   [danh mục con]
└──► Product (N)             [sản phẩm thuộc danh mục]

Product ──────────────────────────────────────────────────────────
│  id (UUID, PK)
│  shop_id (FK → Shop)
│  category_id (FK → Category)
│  name, slug (UNIQUE)
│  description, features[], specifications (JSON)
│  price: Decimal(12,2)
│  stock_quantity: Int
│  sales_count: Int
│  images: String[]
│
├──► OrderItem (N)           [xuất hiện trong đơn hàng]
├──► Review (N)              [được đánh giá]
├──► UserInteraction (N)     [người dùng tương tác]
└──► Wishlist (N)            [trong danh sách yêu thích]

ParentOrder ──────────────────────────────────────────────────────
│  id (UUID, PK)
│  user_id (FK → User)
│  total_payment: Decimal(12,2)
│  payment_status: UNPAID | PAID | REFUNDED
│  payment_method: COD | SEPAY
│  shipping_address: Text
│
└──► ShopOrder (N)           [đơn con của từng shop]

ShopOrder ────────────────────────────────────────────────────────
│  id (UUID, PK)
│  parent_order_id (FK → ParentOrder)
│  shop_id (FK → Shop)
│  shipping_fee: Decimal(10,2)
│  status: PENDING|PREPARING|READY_FOR_PICKUP|SHIPPING|DELIVERED|CANCELLED
│
├──► OrderItem (N)           [các sản phẩm trong đơn này]
└──► TrackingEvent (N)       [lịch sử tracking]

OrderItem ────────────────────────────────────────────────────────
│  id (UUID, PK)
│  shop_order_id (FK → ShopOrder)
│  product_id (FK → Product)
│  quantity: Int
│  price_at_purchase: Decimal(12,2)  [quan trọng: giá tại thời điểm mua]

ChatSession ──────────────────────────────────────────────────────
│  id (UUID, PK)
│  user_id (FK → User, nullable)
│  shop_id (FK → Shop, nullable)
│  status: ACTIVE | CLOSED | ESCALATED
│
└──► ChatMessage (N)

ChatMessage ──────────────────────────────────────────────────────
│  id (UUID, PK)
│  session_id (FK → ChatSession)
│  sender_type: USER | BOT | SHOP
│  message_text: Text
│  intent_detected: String  [dùng cho phân tích AI]
```

---

## 3. Giải thích chi tiết từng Model

### 3.1 User Model

```prisma
model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  password_hash String               // Không lưu password thô, chỉ lưu bcrypt hash
  full_name     String
  phone         String   @unique
  role          UserRole @default(CUSTOMER)
  is_banned     Boolean  @default(false)  // Soft ban, không xóa user
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  @@map("users")   // Tên bảng thực tế trong DB là "users" (lowercase)
}
```

**Giải thích từng field:**
- `@id @default(uuid())` → PK dùng UUID thay vì int tự tăng. **Lý do**: UUID không đoán được (bảo mật hơn), phù hợp với distributed system
- `@db.Uuid` → Lưu dưới dạng native UUID của PostgreSQL (16 bytes, so với varchar 36 bytes)
- `password_hash` → Bắt buộc có, nhưng với Google OAuth user thì hash random UUID
- `phone @unique` → Mỗi số điện thoại chỉ dùng 1 tài khoản. Với Google user, phone là `google-{googleId}`
- `@updatedAt` → Prisma tự động cập nhật khi record thay đổi
- `@@map("users")` → Convention: model dùng PascalCase, bảng DB dùng snake_case

### 3.2 Cấu trúc Order (2-level)

Đây là thiết kế **quan trọng nhất** của hệ thống:

```
ParentOrder (1)
  └── ShopOrder (N) ← mỗi shop = 1 đơn con
        └── OrderItem (N) ← từng sản phẩm
```

**Tại sao cần 2 level?**

User có thể mua sản phẩm của **nhiều shop** cùng lúc. Khi đó:
- `ParentOrder` = đơn hàng tổng, có 1 địa chỉ giao hàng, 1 trạng thái thanh toán
- `ShopOrder` = đơn hàng con, mỗi shop xử lý riêng (có thể hủy 1 shop mà không ảnh hưởng shop khác)
- Mỗi shop chỉ thấy đơn hàng của mình

**price_at_purchase** là field quan trọng:
> Lưu giá **tại thời điểm mua**, không phải giá hiện tại  
> Nếu không có field này, khi shop thay đổi giá → lịch sử đơn hàng bị sai

### 3.3 Category tự tham chiếu (self-referencing)

```prisma
model Category {
  parent_id   Int?
  parent   Category?  @relation("CategoryTree", fields: [parent_id], references: [id])
  children Category[] @relation("CategoryTree")
}
```

**Cấu trúc cây danh mục:**
```
Điện tử (parent_id = null)
├── Điện thoại (parent_id = 1)
│   ├── iPhone (parent_id = 2)
│   └── Samsung (parent_id = 2)
└── Laptop (parent_id = 1)

Thời trang (parent_id = null)
└── Áo (parent_id = X)
```

Khi lọc sản phẩm theo danh mục, ProductsService lấy cả danh mục con:
```typescript
// Lấy category và tất cả children
const categoryIds = [category.id, ...category.children.map(c => c.id)];
where.category_id = { in: categoryIds };
```

### 3.4 UserInteraction - Cơ sở cho AI Recommendation

```prisma
enum InteractionType {
  VIEW          // Người dùng xem sản phẩm
  ADD_TO_CART   // Thêm vào giỏ
  PURCHASE      // Đã mua
}
```

**Weight trong thuật toán gợi ý:**
- VIEW = 1 (ít quan tâm nhất)
- ADD_TO_CART = 5 (quan tâm cao)
- PURCHASE = 8 (đã quyết định mua, rất quan tâm)

### 3.5 Coupon - Hệ thống mã giảm giá

```prisma
model Coupon {
  type             CouponType  // PERCENTAGE hoặc FIXED_AMOUNT
  value            Decimal     // % hoặc số tiền
  min_order_amount Decimal?    // Điều kiện đơn tối thiểu
  max_discount     Decimal?    // Trần giảm giá (cho %)
  usage_limit      Int?        // Số lần dùng tối đa (null = vô hạn)
  used_count       Int         // Đếm đã dùng bao nhiêu lần
  shop_id          String?     // null = coupon toàn sàn, có giá trị = coupon shop cụ thể
}

model CouponUsage {
  @@unique([coupon_id, user_id])  // Mỗi user chỉ dùng 1 coupon 1 lần
}
```

---

## 4. Thiết kế Database - Câu hỏi bảo vệ

### Q: Tại sao dùng UUID thay vì Integer auto-increment?

**A:** 3 lý do:
1. **Bảo mật**: Integer ID dễ bị scan tuần tự (`/orders/1`, `/orders/2`...). UUID không đoán được
2. **Phân tán**: UUID có thể generate ở client/service khác nhau mà không conflict
3. **Merge database**: Khi merge data từ nhiều nguồn, UUID không bị trùng

**Trade-off**: UUID chiếm 16 bytes vs Int 4 bytes, index lớn hơn, query chậm hơn một chút.

### Q: Tại sao lưu `price_at_purchase` thay vì chỉ lưu `product_id`?

**A:** Giá sản phẩm có thể thay đổi theo thời gian. Nếu chỉ lưu `product_id` và join sang bảng Product để lấy giá → giá trong lịch sử đơn hàng sẽ sai khi shop cập nhật giá. Đây là **snapshot pattern** - chụp lại trạng thái tại thời điểm giao dịch.

### Q: Tại sao `password_hash` không null với Google user?

**A:** Khi đăng nhập Google, user không đặt password. Nhưng schema yêu cầu `password_hash NOT NULL`. Giải pháp: hash một UUID random → user không thể login bằng password, chỉ dùng Google. Đây là workaround đơn giản. Giải pháp tốt hơn là tách bảng Auth riêng (provider + credential).

### Q: `@@unique([user_id, product_id])` trong Review có nghĩa gì?

**A:** Constraint ở database level đảm bảo mỗi user chỉ được đánh giá mỗi sản phẩm **1 lần**. Nếu bỏ constraint này và chỉ check ở application code → có thể bị race condition (2 request đồng thời đều pass check → insert 2 records).

---

## 5. ENUMs - Tại sao dùng?

```prisma
enum ShopOrderStatus {
  PENDING          // Vừa đặt
  PREPARING        // Shop đang đóng gói
  READY_FOR_PICKUP // Sẵn sàng cho shipper lấy
  SHIPPING         // Đang giao
  DELIVERED        // Đã giao
  CANCELLED        // Đã hủy
}
```

**Lý do dùng ENUM:**
- Database chỉ chấp nhận các giá trị đã định nghĩa → validation tự động
- Tiết kiệm storage hơn varchar
- Type-safe trong TypeScript (Prisma generate TypeScript types từ ENUM)

**Trade-off**: Thêm/sửa ENUM cần migration database.

---

## 6. Indexes (Prisma tự động tạo)

Prisma tự động tạo index cho:
- `@id` → Primary Key index
- `@unique` → Unique index
- `@relation` FK fields → Index cho foreign key

**Các query thường xuyên và index hỗ trợ:**
```sql
-- Lấy đơn hàng theo user (users.id là PK, parent_orders.user_id có index)
SELECT * FROM parent_orders WHERE user_id = $1;

-- Lấy sản phẩm theo shop (products.shop_id có index)
SELECT * FROM products WHERE shop_id = $1;

-- Tìm coupon theo code (coupons.code là UNIQUE → có index)
SELECT * FROM coupons WHERE code = $1;
```

---

## 7. Tóm tắt 5 điểm chính

1. **2-level Order** (ParentOrder → ShopOrder) để hỗ trợ multi-vendor trong cùng 1 đơn hàng
2. **price_at_purchase** là snapshot pattern, bảo vệ lịch sử khỏi thay đổi giá
3. **UUID làm PK** cho bảo mật và khả năng mở rộng
4. **self-referencing Category** để cấu trúc danh mục dạng cây không giới hạn độ sâu
5. **ENUMs** cho các trạng thái có tập hữu hạn → validation ở tầng database
