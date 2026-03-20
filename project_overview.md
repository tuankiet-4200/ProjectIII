# THUYẾT MINH ĐỒ ÁN MÔN HỌC
[cite_start]**Trường Công Nghệ Thông Tin và Truyền Thông - Đại Học Bách Khoa Hà Nội** [cite: 3]

* **Tên đề tài:** Xây dựng Sàn Thương mại Điện tử Đa người bán (Distributed System) tích hợp AI Chatbot và Hệ thống Theo dõi Vận tải Real-time.
* **Định hướng:** Đồ án môn học tiến tới Đồ án Tốt nghiệp.
* **Sinh viên thực hiện:** [Tên của bạn] - MSSV: 20225203
* [cite_start]**Hình thức:** Nhóm tối đa 2 người[cite: 179].

---

## 1. Tóm tắt dự án (Executive Summary)
Dự án tập trung phát triển một nền tảng Sàn thương mại điện tử (Multi-Vendor Marketplace) có khả năng chịu tải cao, áp dụng kiến trúc Hệ thống phân tán (Distributed Systems). [cite_start]Đề tài kết hợp việc xây dựng chatbot tự động trả lời nâng cao trải nghiệm khách hàng [cite: 18][cite_start], hệ thống quản lý hoạt động vận tải theo thời gian thực [cite: 75][cite_start], và hệ thống gợi ý sản phẩm[cite: 169]. [cite_start]Mục tiêu cốt lõi là tạo ra một sản phẩm phần mềm giải quyết các bài toán thực tiễn của doanh nghiệp e-commerce với đầu ra là một hệ thống chạy thử nghiệm được[cite: 177, 178, 195].

## 2. Các bài toán thực tiễn được giải quyết
Dự án không chỉ là ứng dụng Web CRUD thông thường mà tập trung xử lý các luồng nghiệp vụ phức tạp:
* **Tách đơn hàng (Order Splitting):** Xử lý luồng thanh toán giỏ hàng chứa sản phẩm từ nhiều shop khác nhau, tự động tách thành các đơn hàng con (Shop Orders) để điều phối vận chuyển.
* [cite_start]**Minh bạch Logistics & Chịu tải:** Quản lý hành trình đơn hàng bằng cách ghi nhận các sự kiện thực tế (Event-based)[cite: 78]. Giải quyết bài toán quá tải Database khi nhận tọa độ liên tục bằng cách sử dụng In-memory Cache (Redis) cho Hot Data và Message Queue cho Cold Data.
* [cite_start]**Tối ưu trải nghiệm bằng AI:** Xây dựng AI Chatbot phân tích ngữ nghĩa (NLP) để tự động trả lời tình trạng đơn hàng [cite: 23][cite_start], kết hợp thuật toán Collaborative Filtering để gợi ý sản phẩm cá nhân hóa[cite: 169].

## 3. Kiến trúc Hệ thống & Công nghệ (Tech Stack)
Hệ thống được thiết kế theo hướng Microservices/Phân tán để đảm bảo tính mở rộng:

### 3.1. Frontend (Giao diện Khách hàng & Admin/Shop)
* **Framework:** Next.js (React), TypeScript.
* **UI/UX:** Tailwind CSS, Shadcn UI. Tích hợp bản đồ Leaflet/Google Maps để theo dõi tài xế real-time.

### 3.2. Backend & Microservices
* **Core API:** NestJS (Node.js) ứng dụng OOP và Dependency Injection.
* **AI Service:** Python (FastAPI) chuyên biệt để chạy mô hình gợi ý sản phẩm và giao tiếp với LLM (Gemini API/Dialogflow).
* **ORM:** Prisma ORM (Type-safe database client).

### 3.3. Database & Distributed Components
* **Primary Database:** PostgreSQL (Đảm bảo tính ACID cho giao dịch, đơn hàng, người dùng).
* **In-memory Data Store:** Redis (Quản lý giỏ hàng, caching sản phẩm, lưu tọa độ GPS real-time của tài xế).
* **Message Broker:** RabbitMQ / Kafka (Xử lý hàng đợi bất đồng bộ cho luồng đặt hàng và ghi log sự kiện tracking, tránh nghẽn cổ chai).
* **Real-time Engine:** Socket.io (Phát sóng vị trí tài xế đến trình duyệt người dùng).

## 4. Thiết kế Cơ sở dữ liệu cốt lõi (Core DB Schema)
* **Users & Shops:** Tách biệt định danh tài khoản (`users`) và gian hàng (`shops`).
* **Products:** Quản lý hàng hóa, liên kết chặt chẽ với `shops` và `categories`.
* **Orders:** Gồm `parent_orders` (lưu tổng tiền giao dịch gốc) và `shop_orders` (đơn hàng đã tách theo từng shop để giao).
* [cite_start]**Tracking Events:** Lưu trữ lịch sử hành trình vĩnh viễn (VD: `order_packed`, `picked_up`, `in_transit`, `delivered`), làm nguồn dữ liệu chính cho hệ thống[cite: 80].

## 5. Kế hoạch Thực hiện & Triển khai (Roadmap)
Quy trình phát triển tuân thủ sát tiến độ đánh giá của môn học:
* [cite_start]**Tuần 27 - 29:** Gặp giảng viên[cite: 218], phân tích nghiệp vụ, chốt kiến trúc Database và thiết lập cấu trúc mã nguồn.
* [cite_start]**Tuần 30 - 35:** Nộp báo cáo định kỳ[cite: 220]. Hoàn thiện E-commerce Core (Đăng nhập, Quản lý Shop, Sản phẩm, Giỏ hàng Redis, Thanh toán & Tách đơn).
* **Tuần 36 - 41:** Tích hợp module theo dõi vận tải (Log sự kiện + GPS Real-time qua Socket) và AI Chatbot. [cite_start]Nộp cập nhật tiến độ[cite: 220].
* **Tuần 42:** Kiểm thử toàn hệ thống (End-to-End Testing) và sửa lỗi.
* [cite_start]**Tuần 43 - 45:** Đóng gói Docker, triển khai (Deploy) để có sản phẩm demo trực tiếp, hoàn thiện slide và nộp quyển báo cáo lên hệ thống để bảo vệ[cite: 208, 210, 221].