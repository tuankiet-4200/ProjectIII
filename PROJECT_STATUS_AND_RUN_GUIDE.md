# ProjectIII — Hướng dẫn chạy & tình trạng chức năng

Tài liệu này tổng hợp từ code thực tế trong repo (`backend`, `frontend`) và các file tài liệu (`project_overview.md`, `implementation_plan.md`, `tutorial.md`).

## 1) Tổng quan nhanh

- **Mục tiêu:** Sàn TMĐT đa người bán (multi-vendor marketplace) có tách đơn, tracking logistics, chatbot, realtime notification.
- **Backend:** NestJS + Prisma + PostgreSQL + Redis + JWT + Socket.IO.
- **Frontend:** Next.js App Router + TypeScript + Zustand + Axios + Sonner + Socket.IO client.
- **Infra:** Docker Compose chạy `postgres`, `redis`, `backend`, `frontend`.

---

## 2) Cách chạy dự án

## 2.1 Chạy bằng Docker Compose (khuyến nghị)

Từ thư mục gốc `/Users/kietnt/ProjectIII`:

```bash
docker compose up -d --build
```

Kiểm tra container:

```bash
docker compose ps
```

Truy cập:

- Frontend: `http://localhost:3001`
- Backend API base: `http://localhost:3000/api`

Dừng hệ thống:

```bash
docker compose down
```

Dừng và xóa volume DB:

```bash
docker compose down -v
```

## 2.2 Chạy local không Docker (tham khảo)

### Backend

```bash
cd /Users/kietnt/ProjectIII/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd /Users/kietnt/ProjectIII/frontend
npm install
npm run dev
```

> Lưu ý biến môi trường:
>
> - Backend cần: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`.
> - Frontend cần: `NEXT_PUBLIC_API_URL` (mặc định đang dùng `http://localhost:3000/api`).

---

## 3) Các chức năng cơ bản của dự án (theo thiết kế)

- Đăng ký/đăng nhập người dùng, phân quyền JWT.
- Quản lý hồ sơ người dùng và địa chỉ giao hàng.
- Quản lý shop (tạo shop, cập nhật shop, admin đổi trạng thái shop).
- Quản lý danh mục và sản phẩm (lọc/tìm kiếm/paging).
- Giỏ hàng Redis.
- Checkout + **tách đơn hàng** theo shop.
- Tracking vận chuyển theo sự kiện.
- Realtime notification (Socket.IO) khi đổi trạng thái đơn / có tracking event.
- Chatbot + log hành vi người dùng (interaction).
- Frontend nhiều khu vực: public, auth, vendor, admin.

---

## 4) Chức năng **đã làm được** (đang có trong code)

## 4.1 Backend

### Auth & Users

- Có API:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Có JWT strategy + `JwtAuthGuard`.
- Có role decorator/guard (`Roles`, `RolesGuard`).
- Có API user profile/address:
  - `GET/PATCH /api/users/me`
  - `GET/POST/PATCH/DELETE /api/users/me/addresses...`

### Shops / Categories / Products

- Shops:
  - `GET /api/shops`
  - `GET /api/shops/my`
  - `GET /api/shops/:id`
  - `POST /api/shops`
  - `PATCH /api/shops/:id`
  - `PATCH /api/shops/:id/status` (ADMIN)
- Categories:
  - `GET /api/categories`
  - `GET /api/categories/:id`
  - `POST/PATCH/DELETE /api/categories/:id` (ADMIN)
- Products:
  - `GET /api/products`
  - `GET /api/products/:slug`
  - `POST /api/shops/:shopId/products`
  - `PATCH /api/products/:id/edit`
  - `DELETE /api/products/:id`

### Cart / Orders / Tracking

- Cart Redis:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/:productId`
  - `DELETE /api/cart/items/:productId`
  - `DELETE /api/cart`
- Orders:
  - `POST /api/orders/checkout` (đã có transaction, validate stock, tạo parent+shop orders, trừ stock, clear cart)
  - `GET /api/orders`
  - `GET /api/orders/:id`
  - `GET /api/shops/:shopId/orders`
  - `PATCH /api/shop-orders/:id/status`
- Tracking:
  - `POST /api/shop-orders/:id/tracking` (ADMIN/SHIPPER)
  - `GET /api/shop-orders/:id/tracking`
- Có `TrackingGateway` realtime GPS namespace `/gps-tracking` (join room, update location, lưu Redis TTL).

### Notifications / Chat / Interactions

- Có `NotificationsGateway` websocket để emit:
  - `orderStatusChanged`
  - `trackingEvent`
- `OrdersService` và `TrackingService` đã gọi emit notification.
- Chat API:
  - `POST /api/chat/sessions`
  - `POST /api/chat/sessions/:id/messages`
  - `GET /api/chat/sessions/:id/messages`
  - `PATCH /api/chat/sessions/:id/close`
  - `GET /api/chat/sessions`
- Interaction API:
  - `POST /api/interactions`
  - `GET /api/interactions`

## 4.2 Frontend

- Có luồng auth cơ bản: trang `login/register`, lưu state bằng Zustand, gắn token vào Axios interceptor.
- Có hạ tầng service gọi API cho: auth/users/shops/categories/products/cart/orders.
- Có middleware bảo vệ route `admin`, `vendor`, `checkout`, `orders`, `profile`.
- Có nhiều trang UI đã dựng đầy đủ giao diện:
  - Public: products, product detail, shop detail, cart, checkout, orders, profile.
  - Vendor: dashboard, products, orders.
  - Admin: analytics, categories, shops, users.
- Một số trang vendor/public đã có logic **thử gọi API**, nếu lỗi thì fallback sang mock data.

---

## 5) Chức năng **chưa làm xong / còn hạn chế**

## 5.1 Backend

- **Chatbot AI chưa tích hợp thật**: `ChatService` còn TODO, hiện trả bot message placeholder.
- **Logout đã có endpoint** và blacklist refresh token bằng Redis; token đã logout sẽ không dùng refresh lại được.
- **Một số yêu cầu business trong plan chưa đầy đủ**, ví dụ:
  - Chưa thấy module AI service FastAPI trong repo.
  - Chưa có RabbitMQ/Kafka cho async pipeline.
- **Websocket auth có điểm cần chỉnh**:
  - `NotificationsModule` đang đọc `JWT_SECRET`, trong compose đang khai báo `JWT_ACCESS_SECRET`.
  - Nếu không set thêm `JWT_SECRET`, kết nối socket có thể lỗi verify token.

## 5.2 Frontend

- **Chưa có hook realtime hoàn chỉnh** như kế hoạch (`useSocket.ts` chưa tồn tại).
- `lib/socket.ts` đã có nhưng **chưa được mount/use toàn cục** trong layout.
- Nhiều trang vẫn mang tính **UI mock/demo**, chưa đồng bộ hoàn toàn với dữ liệu backend thực.
- Kiểu dữ liệu frontend (`PaginatedResponse`, `Cart`) chưa khớp hoàn toàn với response thực tế một số API backend (nên đang cần mapping/fallback ở UI).
- `Header/Footer/Home` hiện thiên về demo giao diện, chưa nối nghiệp vụ thật (giỏ hàng, tìm kiếm, user menu thực).

---

## 6) Kết luận hiện trạng

- Dự án đã có nền tảng backend khá đầy đủ cho core e-commerce: auth, catalog, cart Redis, checkout tách đơn, tracking, notification.
- Frontend đã có rất nhiều màn hình và khung quản trị/vendor, nhưng mức tích hợp dữ liệu thật còn chưa đồng nhất ở nhiều trang.
- Để đi vào trạng thái “demo end-to-end ổn định”, nên ưu tiên:
  1. Hoàn thiện contract API response (backend ↔ frontend).
  2. Kết nối realtime frontend bằng `useSocket` + toast event.
  3. Thay mock data bằng API thật cho các trang public/vendor/admin quan trọng.
  4. Hoàn thiện refresh-token rotation đầy đủ và kiểm tra phân quyền chi tiết.
