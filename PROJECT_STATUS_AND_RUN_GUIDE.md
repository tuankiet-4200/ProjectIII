# ProjectIII - Huong dan chay va tinh trang chuc nang

Tai lieu nay phan anh trang thai code hien tai cua repo gom `backend`, `frontend`, `ai-service`, `shipper-app` va `docker-compose.yml`.

## 1) Tong quan

- **Muc tieu:** San thuong mai dien tu da nguoi ban, co tach don theo shop, tracking van chuyen realtime, chatbot AI va goi y san pham dua tren hanh vi nguoi dung.
- **Backend:** NestJS + Prisma + PostgreSQL + Redis + RabbitMQ + JWT + Socket.IO.
- **Frontend:** Next.js App Router + TypeScript + Tailwind CSS + Zustand.
- **AI Service:** FastAPI + DeepSeek Chat API, chi phu trach chatbot.
- **Shipper App:** Expo/React Native cho tai xe dang nhap, nhan don, cap nhat tracking, gui GPS va chup anh giao hang.
- **Infra:** Docker Compose chay `postgres`, `redis`, `rabbitmq`, `backend`, `ai-service`, `frontend`.

## 2) Cach chay du an

### 2.1 Clone repo lan dau tren may khac

Phan nay danh cho truong hop day source len GitHub, sau do clone ve mot may moi.

**Yeu cau cai san tren may:**

- Git
- Docker Desktop hoac Docker Engine co Docker Compose V2
- Toi thieu khoang 4GB RAM trong luc build Docker.
- Neu muon chay mobile app: Node.js va Expo/Expo Go

Clone source:

```bash
git clone <REPO_URL>
cd ProjectIII
```

Tao file moi truong tu file mau:

```bash
cp .env.example .env
cp ai-service/.env.example ai-service/.env
```

Mo `.env` va `ai-service/.env` de kiem tra/cap nhat credential:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: nen doi sang chuoi bi mat manh khi dung that.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: chi can dien neu dung Google OAuth.
- `DEEPSEEK_API_KEY`: can dien trong `ai-service/.env` neu muon chatbot AI tra loi bang DeepSeek.

Neu chua co DeepSeek key, backend/frontend van chay duoc; rieng chatbot DeepSeek se tra dummy message hoac khong goi duoc model that.

Build va chay toan bo he thong:

```bash
docker compose up -d --build
```

Sau khi container len, tao schema database bang Prisma migration:

```bash
docker compose exec backend npx prisma migrate deploy
```

Neu database moi hoan toan va can du lieu mau de xem san pham/category:

```bash
docker compose exec backend npm run db:seed
```

Kiem tra nhanh cac service:

```bash
curl http://localhost:3000/api
curl http://localhost:8000/
curl http://localhost:3000/api/recommendations/public
```

Truy cap ung dung:

- **Frontend Web:** `http://localhost:3001`
- **Backend API:** `http://localhost:3000/api`
- **AI Service:** `http://localhost:8000`
- **RabbitMQ Management:** `http://localhost:15672` voi user/pass mac dinh `guest`/`guest`

Neu clone ve may moi ma frontend hien it/khong co san pham, thu tu can kiem tra la:

1. `docker compose ps` de chac container dang `Up`.
2. `docker compose exec backend npx prisma migrate status`.
3. `docker compose exec backend npm run db:seed` neu DB dang trong.
4. `docker compose logs backend ai-service` neu API van loi.

### 2.2 Chay bang Docker Compose tren may da co san env/db

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

### 2.3 Chay local dev khong dung Docker cho app

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
- Search san pham bang text search tren ten/mo ta san pham.
- Vendor tao/sua/xoa san pham cua shop minh.
- San pham co anh, ton kho, sales count, SEO meta title/description.
- Ghi nhan tuong tac user voi san pham: `VIEW`, `ADD_TO_CART`, `PURCHASE`.

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
- Neu chat gan voi shop, backend gui kem toi da 8 san pham lien quan cua shop duoc loc bang SQL/text search de AI tra loi dua tren du lieu that, khong dung vector/RAG phuc tap.

### Recommendations

- Backend `/recommendations` tu tinh goi y bang `user_interactions`.
- User dang nhap nhan goi y ca nhan hoa.
- Guest/public nhan goi y trending.
- Logic goi y dua tren user da tuong tac san pham nao, nguoi dung tuong tu quan tam san pham nao va fallback trending.

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

- `POST /chat/predict`: chatbot dua tren message, history va thong tin shop.
- `GET /`: health check.

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
- AI service phu thuoc `.env` va DeepSeek API key cho chatbot; recommendation khong phu thuoc AI service.
- Frontend da co nhieu binding API that, nhung mot so dashboard/analytics van nen test lai voi du lieu that.
- Chua thay test e2e day du cho luong Docker + RabbitMQ + AI + socket.
