# Kế hoạch Xây dựng Sàn Thương mại Điện tử Đa người bán

Xây dựng hệ thống Multi-Vendor Marketplace với kiến trúc microservices, sử dụng NestJS (backend), Next.js (frontend), PostgreSQL + Prisma ORM, Redis, và Python FastAPI (AI Service).

## User Review Required

> [!IMPORTANT]
> **Dự án rất lớn** — Kế hoạch này chia thành **10 Phase**, xây dựng tuần tự từ nền tảng đến tính năng nâng cao. Mỗi phase sẽ được build & test riêng trước khi chuyển sang phase tiếp theo.

> [!WARNING]
> **Một số quyết định thiết kế cần xác nhận:**
> 1. **Monorepo vs Multi-repo**: Kế hoạch đề xuất dùng **NestJS Monorepo** (1 repo chứa nhiều apps/libs). Nếu muốn tách riêng từng service thì cần điều chỉnh.
> 2. **Next.js version**: Sẽ dùng Next.js 14+ với App Router. Xác nhận?
> 3. **Authentication**: Dùng JWT (Access Token + Refresh Token) lưu trong HttpOnly Cookie. Xác nhận?
> 4. **Tailwind CSS version**: Dùng Tailwind CSS v3. Xác nhận?
> 5. **Prisma vs TypeORM**: Theo project overview dùng Prisma ORM. Xác nhận giữ nguyên?

---

## Cấu trúc Thư mục Dự án (Đề xuất)

```
ProjectIII/
├── project_overview.md
├── backend/                          # NestJS Monorepo
│   ├── package.json
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma             # DB Schema
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/                   # Shared utilities
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   └── dto/
│   │   ├── prisma/                   # Prisma module
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── redis/                    # Redis module
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   ├── auth/                     # Auth module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   └── dto/
│   │   ├── users/                    # User module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   ├── shops/                    # Shop module
│   │   ├── products/                 # Product module
│   │   ├── categories/               # Category module
│   │   ├── cart/                     # Cart module (Redis)
│   │   ├── orders/                   # Order module
│   │   ├── tracking/                 # Tracking module
│   │   └── chat/                     # AI Chat module
│   └── test/
├── frontend/                         # Next.js App
│   ├── package.json
│   ├── src/
│   │   ├── app/                      # App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   └── ...
├── ai-service/                       # Python FastAPI
│   ├── requirements.txt
│   ├── main.py
│   └── ...
└── docker-compose.yml
```

---

## Phase 1: Project Setup & Database Foundation

### Backend NestJS

#### [NEW] [backend/](file:///Users/kietnt/ProjectIII/backend)
- Khởi tạo NestJS project: `npx -y @nestjs/cli new backend`
- Cài đặt dependencies: `prisma`, `@prisma/client`, `@nestjs/config`, `bcrypt`, `@nestjs/jwt`, `passport`, `class-validator`, `class-transformer`, `ioredis`
- Cấu hình `nest-cli.json` và `tsconfig.json`

#### [NEW] [schema.prisma](file:///Users/kietnt/ProjectIII/backend/prisma/schema.prisma)

Prisma schema chứa toàn bộ bảng theo thiết kế DB đã cung cấp:

```prisma
// === ENUMS ===
enum UserRole { CUSTOMER  ADMIN  SHIPPER }
enum ShopStatus { ACTIVE  BANNED }
enum PaymentStatus { UNPAID  PAID  REFUNDED }
enum PaymentMethod { COD  VNPAY  MOMO }
enum ShopOrderStatus { PENDING  PREPARING  SHIPPING  DELIVERED  CANCELLED }
enum ChatSessionStatus { ACTIVE  CLOSED  ESCALATED }
enum SenderType { USER  BOT }
enum InteractionType { VIEW  ADD_TO_CART  PURCHASE }

// === MODELS ===
model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  password_hash String
  full_name     String
  phone         String   @unique
  role          UserRole @default(CUSTOMER)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  addresses      UserAddress[]
  shops          Shop[]
  parent_orders  ParentOrder[]
  tracking_events TrackingEvent[]
  chat_sessions  ChatSession[]
  interactions   UserInteraction[]

  @@map("users")
}

model UserAddress {
  id           String  @id @default(uuid()) @db.Uuid
  user_id      String  @db.Uuid
  address_line String
  ward         String
  district     String
  city         String
  is_default   Boolean @default(false)

  user User @relation(fields: [user_id], references: [id])

  @@map("user_addresses")
}

model Shop {
  id          String     @id @default(uuid()) @db.Uuid
  owner_id    String     @db.Uuid
  name        String
  description String?
  logo_url    String?
  rating      Decimal    @default(0) @db.Decimal(3, 2)
  status      ShopStatus @default(ACTIVE)
  created_at  DateTime   @default(now())
  updated_at  DateTime   @updatedAt

  owner       User        @relation(fields: [owner_id], references: [id])
  products    Product[]
  shop_orders ShopOrder[]

  @@map("shops")
}

model Category {
  id        Int        @id @default(autoincrement())
  name      String
  slug      String     @unique
  parent_id Int?

  parent    Category?  @relation("CategoryTree", fields: [parent_id], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]

  @@map("categories")
}

model Product {
  id             String   @id @default(uuid()) @db.Uuid
  shop_id        String   @db.Uuid
  category_id    Int
  name           String
  slug           String   @unique
  description    String?
  price          Decimal  @db.Decimal(12, 2)
  stock_quantity Int      @default(0)
  sales_count    Int      @default(0)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  shop         Shop              @relation(fields: [shop_id], references: [id])
  category     Category          @relation(fields: [category_id], references: [id])
  order_items  OrderItem[]
  interactions UserInteraction[]

  @@map("products")
}

model ParentOrder {
  id               String        @id @default(uuid()) @db.Uuid
  user_id          String        @db.Uuid
  total_payment    Decimal       @db.Decimal(12, 2)
  payment_status   PaymentStatus @default(UNPAID)
  payment_method   PaymentMethod
  shipping_address String
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  user        User        @relation(fields: [user_id], references: [id])
  shop_orders ShopOrder[]

  @@map("parent_orders")
}

model ShopOrder {
  id              String          @id @default(uuid()) @db.Uuid
  parent_order_id String          @db.Uuid
  shop_id         String          @db.Uuid
  shipping_fee    Decimal         @db.Decimal(10, 2) @default(0)
  status          ShopOrderStatus @default(PENDING)
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt

  parent_order    ParentOrder     @relation(fields: [parent_order_id], references: [id])
  shop            Shop            @relation(fields: [shop_id], references: [id])
  order_items     OrderItem[]
  tracking_events TrackingEvent[]

  @@map("shop_orders")
}

model OrderItem {
  id                String  @id @default(uuid()) @db.Uuid
  shop_order_id     String  @db.Uuid
  product_id        String  @db.Uuid
  quantity          Int
  price_at_purchase Decimal @db.Decimal(12, 2)

  shop_order ShopOrder @relation(fields: [shop_order_id], references: [id])
  product    Product   @relation(fields: [product_id], references: [id])

  @@map("order_items")
}

model TrackingEvent {
  id            String   @id @default(uuid()) @db.Uuid
  shop_order_id String   @db.Uuid
  shipper_id    String?  @db.Uuid
  event_type    String
  location      String?
  created_at    DateTime @default(now())

  shop_order ShopOrder @relation(fields: [shop_order_id], references: [id])
  shipper    User?     @relation(fields: [shipper_id], references: [id])

  @@map("tracking_events")
}

model ChatSession {
  id         String            @id @default(uuid()) @db.Uuid
  user_id    String?           @db.Uuid
  status     ChatSessionStatus @default(ACTIVE)
  created_at DateTime          @default(now())
  updated_at DateTime          @updatedAt

  user     User?         @relation(fields: [user_id], references: [id])
  messages ChatMessage[]

  @@map("chat_sessions")
}

model ChatMessage {
  id              String     @id @default(uuid()) @db.Uuid
  session_id      String     @db.Uuid
  sender_type     SenderType
  message_text    String
  intent_detected String?
  created_at      DateTime   @default(now())

  session ChatSession @relation(fields: [session_id], references: [id])

  @@map("chat_messages")
}

model UserInteraction {
  id               String          @id @default(uuid()) @db.Uuid
  user_id          String          @db.Uuid
  product_id       String          @db.Uuid
  interaction_type InteractionType
  created_at       DateTime        @default(now())

  user    User    @relation(fields: [user_id], references: [id])
  product Product @relation(fields: [product_id], references: [id])

  @@map("user_interactions")
}
```

#### [NEW] [prisma.module.ts](file:///Users/kietnt/ProjectIII/backend/src/prisma/prisma.module.ts)
- Global Prisma module cung cấp `PrismaService` cho toàn bộ ứng dụng

#### [NEW] [prisma.service.ts](file:///Users/kietnt/ProjectIII/backend/src/prisma/prisma.service.ts)
- Extends `PrismaClient`, implement `OnModuleInit` và `OnModuleDestroy`

#### [NEW] [redis.module.ts](file:///Users/kietnt/ProjectIII/backend/src/redis/redis.module.ts)
- Redis module sử dụng `ioredis`

#### [NEW] [redis.service.ts](file:///Users/kietnt/ProjectIII/backend/src/redis/redis.service.ts)
- Redis service wrapper cho các operations phổ biến (get, set, del, hset, hget...)

---

## Phase 2: User & Auth Module

### Auth

#### [NEW] [auth.module.ts](file:///Users/kietnt/ProjectIII/backend/src/auth/auth.module.ts)
- Import `JwtModule`, `PassportModule`, `UsersModule`

#### [NEW] [auth.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/auth/auth.controller.ts)
- `POST /auth/register` — Đăng ký tài khoản mới
- `POST /auth/login` — Đăng nhập, trả về JWT access + refresh token
- `POST /auth/refresh` — Refresh access token
- `POST /auth/logout` — Xóa refresh token

#### [NEW] [auth.service.ts](file:///Users/kietnt/ProjectIII/backend/src/auth/auth.service.ts)
- `register()`: Hash password bằng bcrypt, tạo user, trả về tokens
- `login()`: Validate credentials, issue JWT tokens
- `refreshToken()`: Verify refresh token, issue new access token

#### [NEW] [jwt.strategy.ts](file:///Users/kietnt/ProjectIII/backend/src/auth/strategies/jwt.strategy.ts)
- Passport JWT strategy cho access token validation

#### [NEW] [roles.guard.ts](file:///Users/kietnt/ProjectIII/backend/src/common/guards/roles.guard.ts)
- Guard kiểm tra role (CUSTOMER, ADMIN, SHIPPER)

### Users

#### [NEW] [users.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/users/users.controller.ts)
- `GET /users/me` — Lấy thông tin user hiện tại
- `PATCH /users/me` — Cập nhật profile
- `GET /users/me/addresses` — Lấy danh sách địa chỉ
- `POST /users/me/addresses` — Thêm địa chỉ
- `PATCH /users/me/addresses/:id` — Cập nhật địa chỉ
- `DELETE /users/me/addresses/:id` — Xóa địa chỉ

---

## Phase 3: Shop/Vendor Module

#### [NEW] [shops.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/shops/shops.controller.ts)
- `POST /shops` — Tạo shop mới (chỉ CUSTOMER role, tự động chuyển quyền)
- `GET /shops/:id` — Xem thông tin shop
- `PATCH /shops/:id` — Cập nhật shop (chỉ owner)
- `GET /shops/my` — Lấy shop của user hiện tại
- Admin: `PATCH /admin/shops/:id/status` — Ban/Unban shop

---

## Phase 4: Product & Category Module

#### [NEW] [categories.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/categories/categories.controller.ts)
- `GET /categories` — Lấy cây danh mục (hierarchical)
- `POST /categories` — Tạo danh mục (ADMIN only)
- `PATCH /categories/:id` — Cập nhật danh mục
- `DELETE /categories/:id` — Xóa danh mục

#### [NEW] [products.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/products/products.controller.ts)
- `GET /products` — Liệt kê + filter + pagination + search
- `GET /products/:slug` — Chi tiết sản phẩm
- `POST /shops/:shopId/products` — Tạo sản phẩm (shop owner)
- `PATCH /products/:id` — Cập nhật sản phẩm (shop owner)
- `DELETE /products/:id` — Xóa sản phẩm

---

## Phase 5: Cart Module (Redis-based)

#### [NEW] [cart.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/cart/cart.controller.ts)
- `GET /cart` — Lấy giỏ hàng từ Redis
- `POST /cart/items` — Thêm sản phẩm vào giỏ
- `PATCH /cart/items/:productId` — Cập nhật số lượng
- `DELETE /cart/items/:productId` — Xóa sản phẩm khỏi giỏ
- `DELETE /cart` — Xóa toàn bộ giỏ hàng

#### [NEW] [cart.service.ts](file:///Users/kietnt/ProjectIII/backend/src/cart/cart.service.ts)
- Redis key format: `cart:{userId}`
- Lưu trữ dạng Hash: `{productId: quantity}`
- Validate stock khi thêm/cập nhật
- Gom nhóm sản phẩm theo shop khi trả về

---

## Phase 6: Order & Order Splitting Module

#### [NEW] [orders.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/orders/orders.controller.ts)
- `POST /orders/checkout` — Tạo đơn hàng từ giỏ (core logic):
  1. Lấy cart từ Redis
  2. Validate stock & price cho mỗi product
  3. Tạo `parent_order` với tổng tiền
  4. Group products theo `shop_id`
  5. Tạo `shop_order` cho mỗi shop
  6. Tạo `order_items` với `price_at_purchase` snapshot
  7. Trừ `stock_quantity`, tăng `sales_count`
  8. Xóa cart khỏi Redis
  9. Sử dụng Prisma transaction đảm bảo ACID
- `GET /orders` — Lấy danh sách parent_orders của user
- `GET /orders/:id` — Chi tiết đơn (bao gồm shop_orders + items)
- Shop owner: `PATCH /shop-orders/:id/status` — Cập nhật trạng thái đơn

---

## Phase 7: Logistics & Tracking Module

#### [NEW] [tracking.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/tracking/tracking.controller.ts)
- `POST /shop-orders/:id/tracking` — Tạo tracking event (SHIPPER/ADMIN)
- `GET /shop-orders/:id/tracking` — Lấy lịch sử tracking events
- Event types: `order_packed`, `picked_up`, `arrived_at_hub`, `delivering`, `delivered`

---

## Phase 8: AI Chatbot Module (Skeleton)

#### [NEW] [chat.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/chat/chat.controller.ts)
- `POST /chat/sessions` — Tạo phiên chat mới
- `POST /chat/sessions/:id/messages` — Gửi tin nhắn
- `GET /chat/sessions/:id/messages` — Lấy lịch sử chat
- `PATCH /chat/sessions/:id/close` — Đóng phiên chat

#### [NEW] [interactions.controller.ts](file:///Users/kietnt/ProjectIII/backend/src/chat/interactions.controller.ts)
- `POST /interactions` — Log hành vi user (VIEW, ADD_TO_CART, PURCHASE)

---

## Phase 9: Frontend (Next.js) — Skeleton

#### [NEW] [frontend/](file:///Users/kietnt/ProjectIII/frontend)
- `npx -y create-next-app@latest ./` với TypeScript, Tailwind CSS, App Router
- Shadcn UI setup
- Trang khách hàng: Home, Products, ProductDetail, Cart, Checkout, Orders
- Trang shop: Dashboard, Products Management, Orders Management
- Trang admin: Dashboard, Shops Management, Categories Management

---

## Phase 10: Real-time & Infrastructure

Tính năng Real-time sẽ sử dụng WebSockets (Socket.io) để đẩy thông báo realtime về đơn hàng (khi thay đổi trạng thái hoặc có tracking event mới) từ Backend đến Frontend.

### Backend (NestJS)
#### [NEW] `src/notifications/`
- Khởi tạo thư mục `notifications` module.
- `notifications.gateway.ts`: Chứa `WebSocketGateway`, xử lý kết nối, auth JWT trên connection, và các methods emit data (`emitOrderStatusChanged`, `emitTrackingEvent`).
- `notifications.module.ts`: Export gateway để các module khác (Orders, Tracking) có thể sử dụng.

#### [MODIFY] `src/orders/orders.service.ts`
- Inject `NotificationsGateway`.
- Thêm logic gọi `emitOrderStatusChanged(userId, payload)` sau khi trạng thái đơn (`ShopOrder`) được cập nhật.

#### [MODIFY] `src/tracking/tracking.service.ts`
- Inject `NotificationsGateway`.
- Thêm logic gọi `emitTrackingEvent(userId, payload)` khi event mới được tạo.

### Frontend (Next.js)
#### [NEW] Cơ sở hạ tầng WebSocket
- Cài đặt dependency: `socket.io-client`.
- Tạo `src/lib/socket.ts` chứa instance Socket.io và thiết lập connection tự động đính kèm `accessToken`.

#### [NEW] `src/hooks/useSocket.ts`
- Tạo custom hook để connect/disconnect.
- Lắng nghe các sự kiện `orderStatusChanged` và báo Toast notification (thông qua Sonner) cho User/Vendor.

#### [MODIFY] `src/app/layout.tsx` (hoặc Client Component gốc)
- Mount `useSocket()` để duy trì kết nối WebSocket toàn cục sau khi user đăng nhập.

### Infrastructure (Docker)
- Cập nhật backend với `Dockerfile`.
- Cập nhật frontend với `Dockerfile`.
- Bổ sung services app vào `docker-compose.yml`.

---

## Verification Plan

### Automated Tests

Mỗi phase được kiểm thử bằng:

1. **Database migration test**
   ```bash
   cd /Users/kietnt/ProjectIII/backend
   npx prisma migrate dev --name init
   npx prisma db push
   ```
   → Kiểm tra migration chạy thành công, không lỗi schema

2. **NestJS E2E tests** (sử dụng `@nestjs/testing`)
   ```bash
   cd /Users/kietnt/ProjectIII/backend
   npm run test:e2e
   ```
   → Test các API endpoints

3. **Unit tests** cho service logic
   ```bash
   cd /Users/kietnt/ProjectIII/backend
   npm run test
   ```

4. **Server startup test**
   ```bash
   cd /Users/kietnt/ProjectIII/backend
   npm run start:dev
   ```
   → Kiểm tra server khởi động thành công trên port 3000

### Manual Verification (sau mỗi phase)

1. **API Testing**: Sử dụng curl/Postman gọi API endpoints và kiểm tra response
2. **Database check**: Dùng `npx prisma studio` để xem trực quan data trong DB
3. **Build check**: Chạy `npm run build` để đảm bảo TypeScript compile không lỗi

> [!NOTE]
> **Thứ tự build đề xuất**: Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Mỗi phase sẽ được build hoàn chỉnh, test, rồi mới chuyển sang phase tiếp theo. Bạn có thể yêu cầu dừng ở bất kỳ phase nào.
