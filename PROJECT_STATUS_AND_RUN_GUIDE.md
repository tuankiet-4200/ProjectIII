# ProjectIII — Hướng dẫn chạy & tình trạng chức năng

Tài liệu này tổng hợp từ code thực tế trong repo (`backend`, `frontend`) và các file tài liệu (`project_overview.md`, `implementation_plan.md`, `tutorial.md`).

## 1) Tổng quan nhanh

- **Mục tiêu:** Xây dựng Sàn TMĐT đa người bán (multi-vendor marketplace) giải quyết các bài toán lớn như Tách đơn hàng (Order Splitting), Theo dõi hành trình (Logistics Tracking Real-time), Khuyến nghị sản phẩm và Chatbot bằng AI.
- **Backend:** Kiến trúc Hệ thống Phân tán (Distributed Systems) và Microservices thu nhỏ. Sử dụng NestJS + Prisma + PostgreSQL + Redis + JWT + Socket.IO.
- **Frontend:** Next.js App Router + TypeScript + Zustand + Tailwind CSS + Shadcn UI.
- **AI Service (Kế hoạch):** Python (FastAPI) (chưa khởi tạo). Khuyến nghị sản phẩm (Collaborative Filtering) và NLP Chatbot.
- **Infra:** Docker Compose chạy đồng thời nhiều cụm: `postgres`, `redis`, `backend`, `frontend`.

---

## 2) Cách chạy dự án

### 2.1 Chạy bằng Docker Compose (Khuyến nghị)

Đây là cách tiêu chuẩn mô phỏng môi trường thật:

Từ thư mục gốc `/Users/kietnt/ProjectIII`:

```bash
docker compose up -d --build
```

Kiểm tra trạng thái các container:

```bash
docker ps
```

Truy cập:
- **Frontend (Web):** `http://localhost:3001`
- **Backend (API):** `http://localhost:3000/api`

Dừng hệ thống:
```bash
docker compose down
```

Xóa dữ liệu Database (Cẩn thận):
```bash
docker compose down -v
```

### 2.2 Chạy môi trường Local (Dev)

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

> **Lưu ý:**
> Cần thiết lập đúng các file `.env` ở backend và frontend ứng với các port Redis, Postgres ở môi trường Local/Docker. Đảm bảo cổng `3000` (Backend) và `3001` (Frontend) không bị chiếm dụng.

---

## 3) Bức tranh tính năng tổng thể (Thiết kế ban đầu)

- Đăng ký/đăng nhập người dùng, phân quyền JWT chuẩn, OAuth Google.
- Quản lý hồ sơ cá nhân và nhiều địa chỉ giao nhận (Address).
- Quản lý Shop (Vendor) toàn diện: Tự động chuyển quyền, ban/unban shop bởi Admin.
- Quản lý Catalog: Phân cấp Category, tìm kiếm và đăng bá sản phẩm.
- Giỏ hàng (Cart) tối ưu tốc độ thông qua Redis In-memory Store.
- Xác nhận Hóa đơn (Checkout) với Transactions và **Thuật toán Tách Đơn (Order Splitting)**.
- Quản lý quá trình Logistics bằng sự kiện lưu vết minh bạch.
- Thông báo Tức thời theo thời gian thực với Socket.IO.
- Chatbot Hỗ trợ người dùng qua AI NLP và gợi ý sản phẩm dựa vào sự kiện (User Interactions Log).

---

## 4) Chức năng **ĐÃ hoàn thành và tích hợp**

### 4.1 Backend (NestJS)

- **Auth & Users:** Token rotation (Access + Refresh JWT). Login/Logout có blacklist Redis token. Quản lý roles (ADMIN, CUSTOMER, VENDOR, SHIPPER) thông qua `RolesGuard`.
- **Shops & Catalog:** Chức năng API RESTful đầy đủ cho Quản lý Gian hàng, Sản phẩm, Phân mục hàng hóa. Đã làm phân cấp parent-child category.
- **Cart & Redis:** API giỏ hàng đã liên kết với `redis.service`. Validate số lượng realtime. 
- **Orders Splitting:** Khi gọi hàm thanh toán, Hệ thống tự lấy Giỏ hàng, lập Hóa đơn lớn (Parent Order), bóc tách và chuyển về đơn từng Shop (Shop Orders), trừ kho hàng (Transaction ACID an toàn với mạng rớt).
- **Tracking & Websocket:** Có cổng `NotificationsGateway` phát đi tọa độ GPS qua Namespace `/gps-tracking` và trạng thái sự kiện đơn hàng.
- **Sản phẩm Đóng gói Docker:** Docker của backend đã được map chuẩn xác (`npm install` ổn định).

### 4.2 Frontend (Next.js)

- **Cấu trúc & Routing:** Hệ thống thư mục phân rõ ràng (Admin, Vendor, Customer Dashboard).
- **Hệ thống Giao diện Sáng/Tối (Dark/Light Mode):** Đã tinh chỉnh đồng bộ hoàn hảo toàn bộ trang Web (Từ Login đến Home page) bằng Tailwind Semantic colors (`bg-background text-foreground`). Header của trang đã tích hợp `ThemeToggle` và Profile user.
- **Luồng Đăng nhập (Auth Flow):** Setup middleware chặn các trang nhạy cảm. Gắn Axios Interceptors và xử lý state với Zustand.
- **Khung giao diện chức năng đồ sộ:** Các Dashboard về Doanh thu, Đơn hàng, Liệt kê sản phẩm cho Chủ Shop (Vendor) và Admin đã được dàn CSS chỉn chu, có mockup UI đẹp.

---

## 5) Chức năng Đang phát triển / Còn hạn chế (TODO List)

### 5.1 Backend & Hệ thống

- **Dịch vụ AI Chatbot & Gợi ý (FastAPI - Python):** Hiện tại thư mục và bộ framework của Python chưa được tạo ra. API `/api/chat/sessions` phía NestJS mới là khung xương, trả về dummy message.
- **Message Broker (Kafka/RabbitMQ):** Kiến trúc có đề cập đến Message Queue cho các Event tải cao (Cold Data), hiện tại chưa được cài đặt.
- **Luồng Tích hợp OAuth Google:** Tuy đã có endpoint redirect callback, nhưng việc config ở `.env` trên môi trường sống chưa đầy đủ.

### 5.2 Frontend

- **Module Thời gian thực (Real-time Socket):** File `lib/socket.ts` đã có nhưng hook `useSocket.ts` để bắt sự kiện pop-up màn hình người dùng khi Tình trạng đơn hàng thay đổi chưa được tạo.
- **Kết nối Backend-API (Data Binding):** Rất nhiều trang Frontend dù có Layout xịn (Dashboard, Shop Analytics) nhưng vẫn đang dùng **Mock Data**. Chúng chưa được chuyển đổi để lấy dữ liệu thực từ các endpoint Nest API.
- **Khớp dữ liệu (API Schema Matching):** Cần đảm bảo kiểu dữ liệu từ Axios trỏ thẳng vào các Interface ở Frontend chuẩn xác (VD: `PaginatedResponse`, `Cart`).

---

## 6) Lộ trình Tiếp theo đề xuất (Next Action Items)

Để nhanh chóng ra một sản phẩm hoàn thiện chạy "Ngon ơ" End-to-End:
1. Gắn **API Call có thật** vào các giao diện chính như Trang Xem Sản phẩm (Public), Giỏ Hàng (Cart), và Trang Thanh Toán (Checkout) trên Frontend.
2. Viết chức năng **`useSocket.ts`** gắn lên cấp độ file Layout.tsx để người dùng nhận Toast Notification khi kiện hàng thay đổi vị trí.
3. Chốt phương án phát triển **FastAPI AI Module**. Nếu chưa xây dựng, cần dựng bộ khung Python lên.
