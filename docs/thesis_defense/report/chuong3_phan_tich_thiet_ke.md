# CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

---

## 3.1 Kiến trúc tổng thể

### 3.1.1 Sơ đồ kiến trúc

Hệ thống được thiết kế theo kiến trúc **Multi-tier with lightweight microservice**, bao gồm các tầng:

```
┌──────────────────────────────────────────────────────┐
│                  PRESENTATION TIER                    │
│   Web Browser (Next.js)    Mobile (React Native)     │
└──────────────────┬───────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼───────────────────────────────────┐
│               GATEWAY / PROXY TIER                    │
│         Nginx Reverse Proxy + SSL Termination         │
└──────┬─────────────────────────────┬─────────────────┘
       │ /api/* /socket.io/*         │ /*
┌──────▼──────────────┐    ┌────────▼──────────────────┐
│   APPLICATION TIER  │    │      FRONTEND TIER         │
│   NestJS Backend    │    │      Next.js Server        │
│   ├── REST API      │    └───────────────────────────┘
│   ├── WebSocket GW  │
│   └── RMQ Consumer  │
└──┬─────┬──────┬─────┘
   │     │      │
┌──▼──┐ ┌▼───┐ ┌▼──────────┐    ┌──────────────────┐
│ PG  │ │Redis│ │ RabbitMQ  │───►│  AI Service       │
│ DB  │ │     │ │  Queue    │    │  FastAPI+DeepSeek │
└─────┘ └─────┘ └───────────┘    └──────────────────┘
```

### 3.1.2 Quyết định kiến trúc

**Tách AI Service thành service riêng** (không tích hợp vào NestJS):
- Lý do kỹ thuật: Python có ecosystem AI phong phú hơn Node.js
- Lý do vận hành: Có thể scale AI service độc lập khi cần
- Giao tiếp qua HTTP (fetch API) — đơn giản, dễ debug

**Dùng RabbitMQ cho Order Processing** (không xử lý đồng bộ):
- Luồng đặt hàng phức tạp có thể mất 3-10 giây
- Synchronous processing → HTTP timeout, UX tệ
- Async via RabbitMQ → response ngay lập tức, kết quả qua WebSocket

---

## 3.2 Thiết kế Database

### 3.2.1 Nguyên tắc thiết kế

Database được thiết kế theo các nguyên tắc:
- **UUID làm Primary Key**: Không đoán được, phù hợp distributed system, bảo mật hơn integer
- **Snapshot Pattern** (`price_at_purchase`): Lưu giá tại thời điểm mua, không bị ảnh hưởng khi shop sửa giá
- **Soft constraints qua ENUM**: Các trạng thái có tập hữu hạn dùng ENUM thay vì varchar
- **Cascade deletes có kiểm soát**: `onDelete: Cascade` chỉ dùng khi xóa parent là hợp lý (user xóa → địa chỉ xóa)

### 3.2.2 Thiết kế bảng chính

**Bảng users — Quản lý người dùng**

```
users
├── id: UUID (PK)
├── email: VARCHAR UNIQUE
├── password_hash: VARCHAR
├── full_name: VARCHAR
├── phone: VARCHAR UNIQUE
├── role: ENUM(CUSTOMER, ADMIN, SHIPPER)
├── is_banned: BOOLEAN DEFAULT false
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP
```

**Thiết kế đơn hàng 2 tầng — Điểm đặc trưng của hệ thống Multi-Vendor**

Khi khách hàng mua sản phẩm từ nhiều shop trong cùng một lần thanh toán, cần cơ chế tách đơn:

```
parent_orders (1 đơn tổng)
├── id: UUID
├── user_id: UUID (FK → users)
├── total_payment: DECIMAL(12,2)
├── payment_status: ENUM(UNPAID, PAID, REFUNDED)
└── payment_method: ENUM(COD, SEPAY)

    └── shop_orders (N đơn con, mỗi shop 1 đơn)
        ├── id: UUID
        ├── parent_order_id: UUID (FK → parent_orders)
        ├── shop_id: UUID (FK → shops)
        ├── shipping_fee: DECIMAL(10,2)
        └── status: ENUM(PENDING, PREPARING, READY_FOR_PICKUP, SHIPPING, DELIVERED, CANCELLED)

            └── order_items (chi tiết từng sản phẩm)
                ├── id: UUID
                ├── shop_order_id: UUID
                ├── product_id: UUID
                ├── quantity: INT
                └── price_at_purchase: DECIMAL(12,2)  ← SNAPSHOT GIÁ
```

**Bảng categories — Cấu trúc cây (Self-referencing)**

```
categories
├── id: INT (autoincrement)
├── name: VARCHAR
├── slug: VARCHAR UNIQUE
├── parent_id: INT? (FK → categories.id)  ← TỰ THAM CHIẾU
├── icon: VARCHAR?
└── description: TEXT?
```

Cấu trúc này cho phép danh mục có nhiều cấp mà không cần thay đổi schema:
- Danh mục cấp 1: `parent_id = NULL`
- Danh mục cấp 2: `parent_id = id_cấp_1`
- Danh mục cấp N: `parent_id = id_cấp_(N-1)`

### 3.2.3 Sơ đồ quan hệ (ERD rút gọn)

```
User ────1───N──► UserAddress
     ────1───N──► Shop
     ────1───N──► ParentOrder
     ────1───N──► Review
     ────1───N──► ChatSession
     ────1───N──► UserInteraction
     ────1───N──► Wishlist
     ────1───N──► CouponUsage

Shop ────1───N──► Product
     ────1───N──► ShopOrder
     ────1───N──► ChatSession
     ────1───N──► Coupon

Category ──1───N──► Product
         ──1───N──► Category (children)

ParentOrder ──1───N──► ShopOrder
ShopOrder   ──1───N──► OrderItem
            ──1───N──► TrackingEvent

Product ──1───N──► OrderItem
        ──1───N──► Review
        ──1───N──► UserInteraction
        ──1───N──► Wishlist

ChatSession ──1───N──► ChatMessage
```

---

## 3.3 Thiết kế API

### 3.3.1 Quy ước API

Hệ thống tuân theo quy ước **RESTful API**:
- Prefix toàn cục: `/api`
- HTTP Methods: GET (đọc), POST (tạo), PUT/PATCH (cập nhật), DELETE (xóa)
- Response format: JSON
- Authentication: Bearer Token trong Authorization header

### 3.3.2 Danh sách API endpoints chính

**Authentication:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký tài khoản |
| POST | /api/auth/login | Đăng nhập |
| POST | /api/auth/refresh | Làm mới access token |
| POST | /api/auth/logout | Đăng xuất |
| GET | /api/auth/google | Bắt đầu Google OAuth |
| GET | /api/auth/google/callback | Callback Google OAuth |

**Products & Categories:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/products | Danh sách sản phẩm (filter, search, sort) |
| GET | /api/products/:slug | Chi tiết sản phẩm |
| POST | /api/shops/:shopId/products | Tạo sản phẩm (vendor) |
| PATCH | /api/products/:id | Cập nhật sản phẩm (vendor) |
| DELETE | /api/products/:id | Xóa sản phẩm (vendor) |
| GET | /api/categories | Danh sách danh mục |

**Cart & Orders:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/cart | Lấy giỏ hàng |
| POST | /api/cart/items | Thêm vào giỏ |
| PATCH | /api/cart/items/:productId | Cập nhật số lượng |
| DELETE | /api/cart/items/:productId | Xóa khỏi giỏ |
| POST | /api/orders/checkout | Đặt hàng |
| GET | /api/orders | Lịch sử đơn hàng |
| GET | /api/orders/:id | Chi tiết đơn hàng |
| POST | /api/orders/:id/confirm-payment | Xác nhận thanh toán SePay |

**Chat:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/chat/sessions | Tạo phiên chat |
| POST | /api/chat/sessions/:id/messages | Gửi tin nhắn |
| GET | /api/chat/sessions/:id/messages | Lấy lịch sử chat |

**Tracking:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/tracking/shop-orders/:id/events | Tạo tracking event (shipper/admin/vendor) |
| GET | /api/tracking/shop-orders/:id/events | Lấy lịch sử tracking |
| GET | /api/tracking/deliveries/active | Đơn đang giao (shipper) |

---

## 3.4 Thiết kế Luồng nghiệp vụ chính

### 3.4.1 Luồng Xác thực (Authentication Flow)

```
[Đăng nhập Email/Password]
User → POST /api/auth/login {email, password}
     → AuthService: findUser by email
     → bcrypt.compare(password, hash)
     → Sai: throw UnauthorizedException
     → Đúng: generateTokens(userId, email, role)
         → jwtService.sign({sub, email, role}, ACCESS_SECRET, "15m")
         → jwtService.sign({sub, email, role}, REFRESH_SECRET, "7d")
     → Response: {access_token, refresh_token, user}
     → Frontend: lưu localStorage + cookie

[Gọi API được bảo vệ]
Request + "Authorization: Bearer {access_token}"
     → JwtAuthGuard → JwtStrategy.validate(payload)
     → prisma.user.findUnique(payload.sub) → còn tồn tại?
     → req.user = {id, email, role, full_name}
     → Handler nhận req.user

[Logout]
POST /api/auth/logout {refresh_token}
     → Verify refresh_token → lấy payload.exp
     → TTL = exp - now()
     → Redis SET "auth:blacklist:refresh:{sha256(token)}" "1" EX {ttl}
     → Frontend: xóa localStorage, xóa cookie
```

### 3.4.2 Luồng Đặt hàng (Order Flow)

Đây là luồng phức tạp nhất của hệ thống, sử dụng RabbitMQ để xử lý bất đồng bộ:

```
PHASE 1 — HTTP Request (< 200ms):
User → POST /api/orders/checkout {payment_method, shipping_address, coupon_code}
     → OrdersService.checkout():
         1. Đọc giỏ hàng từ Redis: HGETALL cart:{userId}
         2. Tạo ParentOrder{status=PENDING, total=0} trong PostgreSQL
         3. Emit message "order.create" vào RabbitMQ queue
         4. Xóa giỏ hàng trong Redis
         5. Response ngay: {message: "đang xử lý", parent_order_id}

PHASE 2 — RabbitMQ Processing (1–5 giây, background):
OrdersProcessor.handleOrderCreate(message):
     1. Fetch products từ DB, group theo shop_id
     2. Tính totalPayment = Σ(price × quantity)
     3. Prisma Transaction ($transaction):
         a. Xử lý coupon: check validity, tính discount, ghi usage
         b. calculateOrderTotals(): subtotal, discount, shipping, tax, total
         c. Cập nhật ParentOrder.total_payment
         d. Với mỗi shop group:
             - Tạo ShopOrder
             - Tạo OrderItems
             - product.updateMany(
                 where: {id, stock >= quantity},
                 data: {stock: decrement, sales_count: increment}
               ) → Optimistic Lock
             - Nếu updated.count === 0 → throw Error → ROLLBACK toàn bộ

PHASE 3 — WebSocket Notification:
Thành công → socket.to("user_{userId}").emit("order_checkout_success", {...})
Thất bại   → delete ParentOrder + socket.emit("order_checkout_failed", {...})
```

**Tại sao Optimistic Locking thay vì Pessimistic Locking?**

Pessimistic locking (SELECT FOR UPDATE) sẽ lock row trong database, các transaction khác phải đợi. Với hàng trăm user đồng thời, điều này gây bottleneck nghiêm trọng. Optimistic locking không lock — chỉ kiểm tra điều kiện tại thời điểm update — hiệu quả hơn nhiều trong môi trường read-heavy.

### 3.4.3 Luồng Realtime (WebSocket Flow)

```
[Kết nối]
Frontend → io(API_URL, {auth: {token: accessToken}})
         → Server: NotificationsGateway.handleConnection(socket)
             → verify JWT → lấy userId
             → socket.join("user_{userId}")
             → userSockets.set(userId, [socket.id])

[Nhận sự kiện]
Server event trigger (đặt hàng xong, shipper update, shop reply chat)
         → notifications.emitXxx(userId, payload)
         → server.to("user_{userId}").emit(eventName, payload)
         → Tất cả socket của user đó nhận (nhiều tab, nhiều thiết bị)
         → Frontend: useNotificationStore.pushXxx(data) → UI update
```

---

## 3.5 Thiết kế Module Backend

Hệ thống backend tổ chức theo **Module Pattern** của NestJS, mỗi module tương ứng một domain nghiệp vụ:

```
AppModule (root)
├── ConfigModule (global) ── đọc biến môi trường
├── PrismaModule (global) ── database connection singleton
├── RedisModule (global)  ── redis client singleton
├── AuthModule            ── xác thực, phân quyền
├── UsersModule           ── quản lý user
├── ShopsModule           ── quản lý shop
├── CategoriesModule      ── danh mục sản phẩm
├── ProductsModule        ── sản phẩm
├── CartModule            ── giỏ hàng (Redis-backed)
├── OrdersModule          ── đặt hàng + RabbitMQ
├── NotificationsModule   ── WebSocket gateway
├── TrackingModule        ── tracking vận chuyển
├── ChatModule            ── chat + AI integration
├── ReviewsModule         ── đánh giá sản phẩm
├── CouponsModule         ── mã giảm giá
├── WishlistModule        ── danh sách yêu thích
├── RecommendationsModule ── gợi ý sản phẩm
├── HomeContentModule     ── nội dung trang chủ
├── AdminAnalyticsModule  ── báo cáo admin
└── UploadsModule         ── upload file
```

Mỗi module tuân theo cấu trúc:
```
{domain}/
├── {domain}.module.ts      ── khai báo module, imports, providers
├── {domain}.controller.ts  ── HTTP endpoints, validation
├── {domain}.service.ts     ── business logic
└── dto/                    ── Data Transfer Objects
```
