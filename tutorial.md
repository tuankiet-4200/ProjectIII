# Hướng dẫn Xây dựng Sàn Thương mại Điện tử Đa Người Bán (Multi-Vendor E-commerce)
*Hệ thống: Node.js (NestJS) + React (Next.js) + PostgreSQL + Redis + Docker*

Tài liệu này là một quyển "Bí kíp" (Tutorial) từng bước được thiết kế riêng dành cho bạn để học và tự code lại toàn bộ dự án từ con số 0. Dự án được chia thành các Giai đoạn (Phases) rõ ràng kèm giải thích nghiệp vụ và công nghệ.

---

## Mở bài: Kiến trúc Hệ thống (Architecture)
Trước khi code, hãy hiểu rõ các thành phần cấu tạo nên dự án này:
1.  **Frontend (Next.js):** Đảm nhiệm giao diện cho Khách hàng (Mua hàng), Chủ Shop (Quản lý gian hàng) và Admin (Duyệt shop). Dùng Next.js App Router, Tailwind CSS và Zustand để quản lý State (Giỏ hàng, Đăng nhập).
2.  **Backend (NestJS):** Đóng vai trò là linh hồn của hệ thống (Core API). Chịu trách nhiệm xử lý logic, xác thực JWT, tách đơn hàng (Order Splitting) và phát sự kiện Real-time (Socket.io).
3.  **Database (PostgreSQL + Prisma):** Postgres là cơ sở dữ liệu quan hệ mạnh mẽ giúp bảo toàn giao dịch mua bán, không bị mất tiền hay sai lệch dữ liệu kho. Prisma là công cụ kết nối Node.js với DB dùng TypeScript.
4.  **In-memory Cache (Redis):** Nơi lưu trữ Giỏ hàng (Tạm thời) cực nhanh, giúp DB không bị quá tải khi người dùng liên tục thêm xoá sửa món hàng.
5.  **Infrastructure (Docker):** Gói gọn tất cả lại thành các Container để chạy ở bất kỳ máy tính/server nào chỉ với 1 lệnh khởi động.

---

## Giai đoạn 1: Chuẩn bị Môi trường & Database (Phase 1)

### 1. Khởi tạo Backend NestJS
Bạn cần bật Terminal và chạy lệnh cài đặt NestJS CLI (Công cụ sinh code tự động):
```bash
npm install -g @nestjs/cli
nest new backend
cd backend
```

### 2. Tích hợp Prisma (ORM) & PostgreSQL
Chúng ta dùng Prisma để thiết kế các bảng (bằng mã code) thay vì phải tự viết lệnh SQL tay.
```bash
npm install prisma --save-dev
npx prisma init
```
*Làm phần này như thế nào?*
1.  Mở thư mục `backend`, vào file `.env` khai báo đường dẫn tới máy chủ Postgres: 
    `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ProjectIII"`
2.  Mở `prisma/schema.prisma` và bắt đầu định nghĩa các Model cốt lõi như `User`, `Shop`, `Product`, `Order`.
3.  Sau khi thiết kế xong, chạy lệnh `npx prisma db push` để Prisma tự động chui vào Postgres và tạo bảng cho bạn.

### 3. Tích hợp Redis
Redis được dùng để lưu Giỏ hàng (Cart).
Cài thư viện: `npm install ioredis`
*Nghiệp vụ:* Khi khách hàng bấm "Thêm vào giỏ", ta không lưu ngay vào Database (sẽ làm server chậm hằn do quá tải thao tác ghi). Thay vào đó, ta lưu vào Redis dưới dạng *Key-Value* (VD Key: `cart:user_123`, Value: `{ productId: 1, quantity: 2 }`).

---

## Giai đoạn 2: Xây dựng Core Modules trên Backend (Phase 2 -> 6)

### 1. Phân quyền và Xác thực (Auth Module)
Hệ thống này cần 3 quyền hạn (Roles) tách biệt: **CUSTOMER**, **VENDOR** (Shop owner) và **ADMIN**.
*   **Hành động:** Viết API Đăng nhập và Đăng ký.
*   **Công cụ:** Sử dụng thư viện `bcrypt` để băm mật khẩu (Bảo mật, không lưu chữ thường vào DB). Sử dụng `@nestjs/jwt` để cấp phát thẻ ra vào (Access Token).
*   **Code check Guard:** Tạo ra các đoạn mã "Bảo vệ" như `RolesGuard`. Lát sau nếu khách hàng cố gọi API "Xoá Shop", hệ thống sẽ cản lại ngay lập tức trả về lỗi 403 Forbidden.

### 2. Quản lý Sản phẩm (Catalog) và Gian Hàng (Shop)
*   Cho phép người dùng tạo Shop để trở thành VENDOR. Vendor có thể đăng bán Sản phẩm (Product) thuộc về các Danh mục (Category).
*   *Lưu ý code:* Product luôn phải gắn với một `shop_id`.

### 3. Nghiệp vụ khó nhất: Thanh Toán & Tách Đơn (Order Splitting)
Đây là nghiệp vụ thực tế cực kỳ hay! 
Khách hàng mua 1 điện thoại (Shop A) và 1 cái áo (Shop B). Khi khách thanh toán, họ chỉ thấy **1 Hóa đơn tổng** (Parent Order = Điện thoại + Áo). 
Nhưng để Shop A và Shop B tự đi giao phần hàng của mình, hệ thống Backend của bạn phải lập trình để tự **TÁCH** hóa đơn đó ra làm **2 Đơn hàng con** (Shop Orders).
*   **Công cụ áp dụng:** **Prisma Transaction**. Đây là thứ đảm bảo luồng Tách đơn diễn ra an toàn. Nếu việc tạo hóa đơn cho Shop B bị lỗi, hệ thống phải Huỷ sạch cả hoá đơn của Shop A và Hóa đơn tổng để trả tiền lại cho khách (Rollback).

---

## Giai đoạn 3: Tính năng Theo dõi & Real-time (Phase 7 & 10)

### 1. Sự kiện Logistics (Tracking Module)
Khi Shipper hoặc Chủ shop thao tác: "Đã đóng gói", "Đang vận chuyển", hệ thống không chỉ sửa chữ Status từ Preparing thành Shipping. Nó phải sinh ra một dòng Log có timestamp trong bảng `TrackingEvent`.

### 2. Thông báo tức thời (WebSockets)
Giao diện phải tự động đẩy thông báo cho người dùng mà họ không cần F5 tải lại trang.
*   **Cài đặt ở Backend:** `npm install @nestjs/websockets @nestjs/platform-socket.io`
*   Viết file `NotificationsGateway` ở NestJS.
*   *Luồng bắn tin:* Khi sửa trạng thái đơn thành công -> Gọi hàm xử lý DB xong -> Bắn tín hiệu `server.to(customer_id).emit('orderStatusChanged', data)`.

---

## Giai đoạn 4: Giao diện Frontend Next.js (Phase 9)

### 1. Cài đặt Next.js
Mở một Terminal bên ngoài thư mục project (Ngang hàng thư mục backend).
```bash
npx create-next-app@latest frontend
```
*(Chọn cấu hình: TypeScript, Tailwind CSS, App Router).*

### 2. Cấu trúc thư mục (File Routing)
Next.js 14+ dùng App Router. Bạn hãy chia thư mục như sau để dễ quản lý:
*   `src/app/(customer)/`: Chứa trang chủ, chi tiết sản phẩm, giỏ hàng. Layout có Thanh Header tìm kiếm.
*   `src/app/(vendor)/`: Trang quản lý Shop, giao diện dạng Dashboard cho người bán hàng.
*   `src/app/admin/`: Bảng điều khiển riêng cho Admin.

### 3. Gọi API và Quản lý State
*   Nhẹ nhàng gọi API bằng hàm `fetch()` của Next.js hoặc `axios`. 
*   Quản lý thông tin Đăng nhập (`user`, `token`) ở toàn bộ React App thông qua **Zustand**. Zustand mạnh hơn Redux vì nó không cần viết quá nhiều Boilerplate code.
*   Lắng nghe Socket: Viết 1 Custom Hook tên là `useSocket.ts` để kết nối vào `localhost:3000`. Cứ khi nào có sự kiện `orderStatusChanged` bay tới, gọi thư viện pop-up toast (Ví dụ `sonner`) hiển thị lên màn hình.

---

## Giai đoạn 5: Đóng gói (Dockerization) để Deploy lên Server (Phase Cuối Cùng)

Tất cả đã chạy xong trên máy tính cá nhân (localhost) của bạn. Làm sao ném toàn bộ nồi chảo này lên Server AWS/Google Cloud cực nhanh mà không phải đi cài lại từng cái Node/Postgres/Redis một?
Câu trả lời là **Docker**.

### 1. Dockerfile
Viết 2 file text có tên `Dockerfile`, bỏ 1 cái vào thu mục frontend, 1 cái vào thư mục backend.
Dockerfile giống như một tờ công thức làm bếp:
- *Bước 1:* Tải hệ điều hành Alpine nhỏ gọn chứa sẵn Node.js 20.
- *Bước 2:* Ném toàn bộ code từ máy tính vào máy tính nhỏ đó (Container).
- *Bước 3:* Chạy lệnh `npm install` và `npm run build` để tối ưu file chạy.

### 2. Tinh lính đánh thuê: Docker Compose
Viết 1 file tổng ở ngoài cung: `docker-compose.yml`. File này đóng vai trò là "Nhạc trưởng".
Nó quy định 4 dịch vụ phải chạy cùng nhau và nối chung mạng lan ảo thì hệ thống mới thông.
1. `db`: Lấy file iso của hệ điều hành cài sẵn Postgres ở trên mạng xuống (Docker Hub).
2. `redis`: Lấy máy ảo chạy sẵn Redis.
3. `backend`: Đọc hướng dẫn ở `backend/Dockerfile` để làm thịt. Nối với biến môi trường của db và redis.
4. `frontend`: Đọc hướng dẫn ở `frontend/Dockerfile` để dựng Web, trỏ API về phía dịch vụ `backend`.

### 3. Lệnh khởi chạy thần thánh
Khi ném project lên môi trường Server Ubuntu thực tế, bạn chỉ cần gõ đúng 1 dòng lệnh màu nhiệm này. Máy chủ sẽ tự tải hệ thống của bạn lên Internet:
```bash
docker-compose up -d --build
```

---

*Chúc bạn thành công với hành trình xây dựng Dự án Hệ thống phân tán lớn nhất của mình! Mọi thay đổi về code bạn hoàn toàn có thể xem lại trong ứng dụng hiện tại.*
