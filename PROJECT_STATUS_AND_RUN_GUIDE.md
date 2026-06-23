# ProjectIII - Huong dan chay va tinh trang chuc nang

Tai lieu nay phan anh trang thai code hien tai cua repo gom `backend`, `frontend`, `ai-service`, `shipper-app` va `docker-compose.yml`.

## 1) Tong quan

- **Muc tieu:** San thuong mai dien tu da nguoi ban, co tach don theo shop, tracking van chuyen realtime, chatbot va goi y/tim kiem bang AI.
- **Backend:** NestJS + Prisma + PostgreSQL + Redis + RabbitMQ + JWT + Socket.IO.
- **Frontend:** Next.js App Router + TypeScript + Tailwind CSS + Zustand.
- **AI Service:** FastAPI + DeepSeek Chat API + sentence-transformers local embeddings + ChromaDB + SQLAlchemy, cung cap chat, semantic search va recommendation.
- **Shipper App:** Expo/React Native cho tai xe dang nhap, nhan don, cap nhat tracking, gui GPS va chup anh giao hang.
- **Infra:** Docker Compose chay `postgres`, `redis`, `rabbitmq`, `backend`, `ai-service`, `frontend`.

## 2) Cach chay du an

### 2.1 Chay bang Docker Compose

Tu thu muc goc:

```bash
docker compose up -d --build
```

Kiem tra container:

```bash
docker ps
```

Truy cap:

- **Frontend Web:** `http://localhost:3001`
- **Backend API:** `http://localhost:3000/api`
- **AI Service:** `http://localhost:8000`
- **RabbitMQ Management:** `http://localhost:15672` voi user/pass mac dinh `guest`/`guest`

Dung he thong:

```bash
docker compose down
```

Xoa ca du lieu volume:

```bash
docker compose down -v
```

### 2.2 Chay local dev

Can co PostgreSQL, Redis va RabbitMQ dang chay, dong thoi cau hinh `.env` phu hop cho tung service.

**Backend:**

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

**AI Service:**

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Shipper App:**

```bash
cd shipper-app
npm install
npm start
```

## 3) Module va chuc nang backend

### Auth va Users

- Dang ky, dang nhap, refresh token, logout.
- JWT access/refresh token, blacklist refresh token bang Redis.
- Google OAuth endpoints.
- `JwtAuthGuard`, `RolesGuard`, decorator role.
- Admin xem/tong hop user, tao user, ban/unban user.
- User xem/cap nhat profile.
- User quan ly dia chi giao hang: them, sua, xoa.

### Shops va Catalog

- User tao shop cua minh.
- Xem danh sach shop public, chi tiet shop va san pham trong shop.
- Vendor xem shop cua minh, cap nhat thong tin shop.
- Admin cap nhat trang thai shop: `PENDING`, `ACTIVE`, `REJECTED`, `BANNED`.
- Category co cau truc cha/con; public xem, admin them/sua/xoa.

### Products

- Public lay danh sach san pham, chi tiet theo slug.
- Loc theo category/shop, sort theo moi nhat, gia, ban chay.
- Search uu tien AI semantic search; fallback sang text search khi AI service loi.
- Vendor tao/sua/xoa san pham cua shop minh.
- San pham co anh, ton kho, sales count, SEO meta title/description.
- Ghi nhan tuong tac user voi san pham: `VIEW`, `ADD_TO_CART`, `PURCHASE`.
- Khi san pham thay doi, backend goi AI `/sync` de dong bo vector store.

### Cart

- Gio hang luu trong Redis theo user.
- Xem gio hang, them item, cap nhat so luong, xoa item, xoa toan bo gio.
- Validate san pham va ton kho khi thao tac.

### Orders va checkout bat dong bo

- Checkout tao `ParentOrder` trang thai dang xu ly va day event `order.create` vao RabbitMQ.
- `OrdersProcessor` xu ly event trong transaction:
  - doc cart snapshot,
  - nhom item theo shop,
  - tinh tong tien,
  - ap dung coupon neu hop le,
  - tao `ShopOrder` va `OrderItem`,
  - tru ton kho,
  - tang `sales_count`,
  - cap nhat tong tien parent order.
- Gio hang Redis duoc xoa sau khi tao yeu cau checkout.
- Socket thong bao `order_checkout_success` hoac `order_checkout_failed`.
- User xem danh sach/chi tiet don hang.
- Vendor xem don cua shop va cap nhat trang thai shop order.

### Coupons

- Admin/vendor tao coupon.
- Coupon toan he thong hoac rieng cho shop.
- Ho tro giam theo phan tram va giam so tien co dinh.
- Ho tro don toi thieu, giam toi da, gioi han luot dung, han su dung.
- Validate coupon truoc khi checkout.
- Ghi nhan user da dung coupon, moi user chi dung mot lan cho moi coupon.
- Admin xem tat ca coupon, vendor xem coupon cua shop minh.
- Xoa coupon theo quyen.

### Wishlist va Reviews

- Wishlist: lay danh sach, toggle san pham, check san pham da yeu thich chua.
- Reviews: user danh gia san pham da mua, moi user mot review tren mot san pham.
- Xem review theo san pham/shop.
- Tu dong tinh lai rating cua shop tu review san pham.

### Tracking, realtime va upload

- Tao tracking event cho shop order: `order_packed`, `ready_for_pickup`, `picked_up`, `arrived_at_hub`, `delivering`, `delivered`.
- Tu dong map tracking event sang status don: `PREPARING`, `READY_FOR_PICKUP`, `SHIPPING`, `DELIVERED`.
- Ho tro anh xac nhan giao hang `proof_image`.
- Shipper/Admin xem cac don giao active.
- `NotificationsGateway` gui realtime:
  - `orderStatusChanged`
  - `trackingEvent`
  - `newChatMessage`
  - checkout success/failure.
- `TrackingGateway` namespace `/gps-tracking`:
  - customer join room theo `shopOrderId`,
  - shipper gui GPS,
  - vi tri moi nhat luu Redis TTL 2 gio,
  - broadcast `locationUpdated`.
- Upload API tra ve URL file trong `backend/uploads`.

### Chat va AI

- Tao chat session user-shop.
- Luu lich su tin nhan.
- Customer gui tin nhan; vendor xem session va tra loi.
- Socket realtime tin nhan moi.
- Shop co truong `ai_auto_respond`.
- Khi auto reply bat hoac session khong gan shop, backend goi AI service `/chat/predict` va luu tin nhan BOT.

### Recommendations

- Backend `/recommendations` goi AI service.
- User dang nhap nhan goi y ca nhan hoa.
- Guest/public nhan goi y trending.
- AI service ket hop collaborative filtering, content-based vector search va fallback trending.

## 4) Frontend Web hien co

- Trang chu, danh sach san pham, chi tiet san pham.
- Trang categories va category detail.
- Trang chi tiet shop.
- Login, register, logout, Google callback.
- Cart, checkout, profile.
- Orders list/detail va trang tracking don hang bang Leaflet.
- Chat widget o trang shop/san pham.
- Notification bell, unread count, danh dau da doc, xoa thong bao.
- Admin pages: users, shops, categories, analytics.
- Vendor pages: dashboard, products, create product, orders, coupons, chat.
- Seller register page.
- Dark/light theme va state bang Zustand.

## 5) AI Service hien co

- `GET /search?q=...&top_k=...`: semantic search, tra ve product ids.
- `GET /recommendations/{user_id}`: goi y san pham cho guest/user.
- `POST /chat/predict`: chatbot dua tren message, history va thong tin shop.
- `POST /sync`: dong bo product data vao vector store.

## 6) Shipper App hien co

- Dang nhap bang tai khoan shipper.
- Lay danh sach active deliveries.
- Quet/nhap ma shop order de nhan don.
- Cap nhat tracking event.
- Gui GPS realtime qua Socket.IO.
- Chup anh xac nhan khi `delivered`.
- Goi dien khach hang va mo ban do den dia chi giao.

## 7) Han che va viec can lam tiep

- Can kiem tra lai dong chay end-to-end sau moi thay doi vi worktree hien co dang co nhieu file modified.
- OAuth Google can cau hinh lai client secret/callback cho moi moi truong thuc te; khong nen commit secret that.
- AI service phu thuoc `.env` va DeepSeek API key cho chatbot; semantic search/recommendation dung local embedding model.
- Semantic search/recommendation can co du lieu san pham da sync vao vector store.
- Frontend da co nhieu binding API that, nhung mot so dashboard/analytics van nen test lai voi du lieu that.
- Chua thay test e2e day du cho luong Docker + RabbitMQ + AI + socket.
