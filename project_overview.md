# Tong quan ProjectIII

## 1. Muc tieu du an

ProjectIII la san thuong mai dien tu da nguoi ban, tap trung vao cac bai toan thuc te cua e-commerce:

- Nguoi mua co the tim kiem, xem san pham, them gio hang, dat don va theo doi van chuyen.
- Chu shop co the quan ly gian hang, san pham, don hang, coupon va chat voi khach.
- Admin co the quan ly nguoi dung, danh muc va trang thai shop.
- Shipper co app rieng de nhan don, cap nhat hanh trinh, gui GPS va xac nhan giao hang.
- AI service ho tro chatbot, semantic search va recommendation.

## 2. Kien truc hien tai

Repo gom 4 phan ung dung chinh:

- `backend`: NestJS Core API.
- `frontend`: Next.js web app.
- `ai-service`: FastAPI service cho AI chatbot, semantic search va recommendation.
- `shipper-app`: Expo/React Native app cho shipper.

Ha tang chay qua Docker Compose:

- PostgreSQL: database chinh.
- Redis: gio hang, blacklist token, GPS hot data.
- RabbitMQ: hang doi xu ly checkout bat dong bo.
- Socket.IO: realtime notification, chat va GPS tracking.

## 3. Cong nghe

### Backend

- NestJS, TypeScript.
- Prisma ORM.
- PostgreSQL.
- Redis voi `ioredis`.
- RabbitMQ qua NestJS microservices.
- JWT, Passport, Google OAuth.
- Socket.IO gateway.

### Frontend

- Next.js App Router.
- React, TypeScript.
- Tailwind CSS.
- Zustand.
- Axios.
- Leaflet cho ban do tracking.

### AI Service

- FastAPI.
- DeepSeek Chat API cho chatbot.
- sentence-transformers local embeddings cho semantic search/RAG/recommendation.
- ChromaDB/vector store.
- SQLAlchemy/psycopg2 de doc du lieu PostgreSQL.

### Mobile Shipper

- Expo/React Native.
- AsyncStorage.
- Expo Camera, Image Picker, Location.
- Socket.IO client.

## 4. Cac chuc nang da co

### Auth, user va phan quyen

- Dang ky, dang nhap, refresh token, logout.
- Blacklist refresh token bang Redis.
- Google OAuth endpoints.
- Role `CUSTOMER`, `ADMIN`, `SHIPPER`.
- Admin quan ly user va ban/unban.
- User quan ly profile va dia chi giao hang.

### Marketplace core

- Quan ly shop voi trang thai `PENDING`, `ACTIVE`, `REJECTED`, `BANNED`.
- Quan ly category cha/con.
- Quan ly san pham, anh san pham, ton kho, doanh so, SEO meta.
- Public product listing/detail, category page, shop detail.
- Search san pham uu tien semantic search, fallback text search.

### Gio hang va dat hang

- Gio hang luu trong Redis.
- Checkout tao parent order va day viec xu ly vao RabbitMQ.
- Processor tach don theo shop, tao shop order, tao order item, tru kho va cap nhat tong tien trong transaction.
- Ho tro coupon trong checkout.
- Socket thong bao ket qua xu ly checkout.

### Van chuyen va realtime

- Tracking event cho tung shop order.
- Tu dong cap nhat status don theo event tracking.
- Notification realtime cho thay doi status, tracking event va chat.
- GPS tracking namespace `/gps-tracking`, luu vi tri moi nhat vao Redis va broadcast cho man hinh tracking.
- Frontend co trang tracking ban do Leaflet.
- Shipper app gui GPS, cap nhat event va chup anh xac nhan giao hang.

### Tuong tac nguoi dung

- Wishlist.
- Review san pham, tinh lai rating shop.
- User interaction log cho recommendation.
- Chat customer-shop, vendor inbox va AI auto reply khi bat.

### AI

- Chat endpoint `/chat/predict`.
- Recommendation endpoint `/recommendations/{user_id}`.
- Semantic search endpoint `/search`.
- Sync endpoint `/sync` de nap lai vector store khi catalog thay doi.

## 5. Cac bang du lieu chinh

- `users`, `user_addresses`
- `shops`
- `categories`
- `products`
- `parent_orders`, `shop_orders`, `order_items`
- `tracking_events`
- `reviews`
- `coupons`, `coupon_usages`
- `wishlists`
- `chat_sessions`, `chat_messages`
- `user_interactions`

## 6. Diem can tiep tuc hoan thien

- Bo sung/kiem tra test e2e cho luong checkout bat dong bo RabbitMQ.
- Kiem tra lai cac dashboard frontend voi du lieu that.
- Quan ly secret OAuth/API key an toan hon cho moi truong deploy.
- Dam bao AI vector store duoc sync sau seed/migration.
- Dong bo tai lieu demo va script seed neu can thuyet trinh.
