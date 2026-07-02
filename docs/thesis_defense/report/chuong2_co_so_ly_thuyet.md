# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

---

## 2.1 Mô hình thương mại điện tử đa nhà bán (Multi-Vendor)

### 2.1.1 Khái niệm

Mô hình Multi-Vendor E-Commerce (TMĐT đa nhà bán) là một nền tảng cho phép nhiều nhà bán hàng độc lập cùng kinh doanh trên một hệ thống duy nhất. Khác với website bán hàng đơn nhà bán (single-vendor), nền tảng đa nhà bán đóng vai trò trung gian giữa người mua và nhiều người bán, tương tự mô hình của Amazon Marketplace, Shopee, hay Lazada.

### 2.1.2 Đặc điểm kỹ thuật của hệ thống Multi-Vendor

Một hệ thống multi-vendor cần giải quyết các vấn đề đặc thù:

- **Order Splitting**: Khi khách hàng mua từ nhiều shop trong cùng một đơn hàng, hệ thống phải tách đơn hàng theo từng shop để mỗi vendor xử lý độc lập.
- **Multi-level authorization**: Phân quyền phức tạp — Admin, Vendor, Customer, Shipper có quyền truy cập khác nhau đến cùng dữ liệu.
- **Shop isolation**: Vendor chỉ thấy và quản lý được dữ liệu của shop mình, không thể truy cập dữ liệu shop khác.
- **Distributed inventory**: Tồn kho được quản lý riêng theo từng shop, cần cơ chế chống oversell khi nhiều khách mua cùng lúc.

---

## 2.2 Các công nghệ Backend

### 2.2.1 NestJS Framework

NestJS là một framework Node.js được xây dựng bằng TypeScript, lấy cảm hứng từ kiến trúc Angular. NestJS cung cấp một cấu trúc ứng dụng rõ ràng thông qua hệ thống **Module**, **Controller**, **Service** và cơ chế **Dependency Injection** (DI).

**Lý do chọn NestJS:**
- Module system giúp tổ chức code theo domain rõ ràng (auth, orders, products...)
- TypeScript tích hợp sẵn — type safety giảm thiểu runtime errors
- Hỗ trợ sẵn Microservices (RabbitMQ, Kafka, Redis transport)
- Decorator-based API (`@Controller`, `@Get`, `@UseGuards`) — code ngắn gọn, dễ đọc
- Tích hợp tốt với Passport.js cho authentication

### 2.2.2 Prisma ORM

Prisma là một ORM (Object-Relational Mapper) thế hệ mới cho Node.js và TypeScript. Prisma cung cấp:

- **Prisma Schema**: Ngôn ngữ khai báo cấu trúc database dạng DSL
- **Prisma Client**: TypeScript client auto-generated từ schema — fully type-safe
- **Prisma Migrate**: Quản lý database migrations tự động
- **Prisma Studio**: GUI để xem và chỉnh sửa dữ liệu

**So sánh với TypeORM (ORM phổ biến khác):**
| | Prisma | TypeORM |
|---|---|---|
| Type safety | Rất cao (auto-generated) | Trung bình |
| Query API | Fluent, dễ đọc | Phức tạp hơn |
| Migration | Tự động từ schema | Thủ công hơn |
| Learning curve | Thấp | Cao hơn |

### 2.2.3 PostgreSQL

PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở, nổi tiếng với độ tin cậy và tuân thủ chuẩn SQL đầy đủ.

**Lý do chọn PostgreSQL:**
- Hỗ trợ native UUID type (16 bytes, hiệu quả hơn VARCHAR(36))
- Array fields (`images TEXT[]`, `features TEXT[]`) — lưu danh sách không cần bảng phụ
- JSONB field (`specifications`) — lưu dữ liệu semi-structured
- Self-referencing relations (danh mục cây)
- ACID transactions đầy đủ
- Partial indexes, expression indexes nâng cao hiệu năng

### 2.2.4 Redis

Redis (Remote Dictionary Server) là hệ thống lưu trữ key-value in-memory, hỗ trợ nhiều cấu trúc dữ liệu (String, Hash, List, Set, Sorted Set).

**Ứng dụng trong hệ thống:**

| Use case | Cấu trúc Redis | Chi tiết |
|----------|---------------|---------|
| Giỏ hàng | Hash | `cart:{userId}` → `{productId: quantity}` |
| Token Blacklist | String + TTL | `auth:blacklist:refresh:{hash}` → `"1"` |

**Lý do dùng Redis cho giỏ hàng:**
- O(1) cho HGET, HSET, HDEL — nhanh hơn PostgreSQL query nhiều lần
- Giỏ hàng thay đổi thường xuyên, không cần ACID
- TTL có thể tự xóa giỏ hàng cũ nếu cần

### 2.2.5 RabbitMQ — Message Broker

RabbitMQ là message broker phổ biến, triển khai giao thức AMQP (Advanced Message Queuing Protocol).

**Khái niệm cơ bản:**
- **Producer**: Thành phần đẩy message vào queue (OrdersService)
- **Queue**: Hàng đợi lưu trữ messages (orders_queue)
- **Consumer**: Thành phần xử lý message (OrdersProcessor)
- **Exchange**: Định tuyến message đến queue phù hợp
- **Durability**: Queue và message tồn tại qua restart của RabbitMQ

**Lý do dùng RabbitMQ cho xử lý đơn hàng:**

Luồng đặt hàng bao gồm nhiều bước phức tạp: kiểm tra tồn kho, áp dụng coupon, tạo nhiều bản ghi database, gọi API thanh toán bên ngoài. Nếu xử lý đồng bộ (synchronous), request HTTP có thể timeout (> 30 giây). Với RabbitMQ, response trả về ngay lập tức, xử lý nặng diễn ra asynchronously ở background, kết quả thông báo qua WebSocket.

---

## 2.3 Các công nghệ Frontend

### 2.3.1 Next.js 15

Next.js là React framework hỗ trợ Server-Side Rendering (SSR) và Static Site Generation (SSG). Phiên bản 15 giới thiệu **App Router** với React Server Components (RSC) mặc định.

**Tính năng quan trọng được sử dụng:**
- **App Router**: Routing dựa trên filesystem với nested layouts
- **Route Groups**: `(auth)`, `(public)` — group routes có layout chung mà không ảnh hưởng URL
- **Middleware (Edge Runtime)**: Kiểm soát truy cập route ở tầng CDN/Edge, trước khi request đến server
- **Server Components**: Render HTML ở server, giảm JavaScript bundle gửi về client

### 2.3.2 Zustand — State Management

Zustand là thư viện state management nhẹ cho React, thay thế Redux trong các dự án vừa và nhỏ.

**Đặc điểm:**
- Bundle size ~1KB (vs Redux ~8KB)
- Không cần boilerplate (actions, reducers, selectors)
- Middleware `persist` — tự động serialize state sang localStorage
- Subscribe pattern — component chỉ re-render khi phần state mình dùng thay đổi

### 2.3.3 Socket.IO

Socket.IO là thư viện cho phép giao tiếp realtime 2 chiều giữa client và server, xây dựng trên WebSocket với polling fallback.

**Tính năng quan trọng:**
- **Rooms**: Group clients, broadcast đến đúng nhóm
- **Auto-reconnect**: Tự động kết nối lại khi mất kết nối
- **Fallback**: Long-polling khi WebSocket bị block bởi proxy

---

## 2.4 AI và Machine Learning

### 2.4.1 Large Language Models (LLM)

LLM (Mô hình ngôn ngữ lớn) là các mô hình AI được huấn luyện trên lượng văn bản khổng lồ, có khả năng hiểu và sinh ra ngôn ngữ tự nhiên. Các LLM phổ biến gồm GPT-4 (OpenAI), Claude (Anthropic), Gemini (Google), và DeepSeek.

**DeepSeek** được chọn trong đề tài vì:
- Chi phí API thấp hơn GPT-4 đáng kể (phù hợp budget đồ án)
- Chất lượng tiếng Việt tốt
- API tương thích OpenAI format — dễ tích hợp và swap sau này

### 2.4.2 Prompt Engineering và Context Injection

**Prompt Engineering** là kỹ thuật thiết kế câu lệnh (prompt) để định hướng output của LLM. Trong hệ thống chatbot, kỹ thuật **Context Injection** được áp dụng:

- **System Prompt**: Định nghĩa vai trò, quy tắc, và dữ liệu ngữ cảnh cho AI
- **Context**: Dữ liệu thực tế (sản phẩm từ database) được nhúng vào system prompt
- **History**: Lịch sử hội thoại giúp AI hiểu ngữ cảnh cuộc trò chuyện

**Cơ chế hoạt động trong hệ thống:**
```
User message → keyword extraction → SQL query sản phẩm → format context
→ [System prompt + context + history + user message] → DeepSeek API → Reply
```

Kỹ thuật này khác với **RAG (Retrieval-Augmented Generation)** đầy đủ — RAG dùng embedding model để chuyển văn bản thành vector và tìm kiếm theo semantic similarity. Hệ thống này dùng keyword-based SQL search, đơn giản hơn nhưng đủ hiệu quả cho dữ liệu sản phẩm có cấu trúc.

### 2.4.3 Hệ thống gợi ý sản phẩm (Recommendation)

**Interaction-based Scoring** là kỹ thuật gợi ý sản phẩm dựa trên hành vi người dùng. Mỗi tương tác được gán trọng số:

| Hành vi | Trọng số | Lý do |
|---------|----------|-------|
| Xem sản phẩm (VIEW) | 1 | Quan tâm thấp |
| Thêm giỏ hàng (ADD_TO_CART) | 5 | Quan tâm cao |
| Đã mua (PURCHASE) | 8 | Đã quyết định |

Kết hợp với **Recency Decay** (tương tác gần đây quan trọng hơn), hệ thống tính điểm tích lũy cho từng danh mục và shop, từ đó gợi ý sản phẩm cùng danh mục/shop mà user chưa tương tác.

---

## 2.5 Bảo mật hệ thống

### 2.5.1 JSON Web Token (JWT)

JWT là chuẩn mở (RFC 7519) để truyền thông tin an toàn dưới dạng JSON object được ký số. Cấu trúc JWT gồm 3 phần:

```
Header.Payload.Signature
```

- **Header**: Thuật toán ký (thường là HS256 — HMAC SHA-256)
- **Payload**: Data (user ID, email, role, thời gian hết hạn)
- **Signature**: HMAC(base64(header) + "." + base64(payload), secret)

**Dual-Token Pattern:**
- **Access Token** (15 phút): Gửi kèm mọi API request để xác thực
- **Refresh Token** (7 ngày): Chỉ dùng để lấy Access Token mới

### 2.5.2 bcrypt

bcrypt là thuật toán hash password được thiết kế đặc biệt để chống brute-force. Đặc điểm:
- **Adaptive**: Cost factor (rounds) có thể tăng khi hardware mạnh hơn
- **Salt**: Tự động thêm random salt — cùng password cho hash khác nhau — chống Rainbow Table
- Cost factor 10 = 2^10 = 1024 vòng hash → mất ~100ms/hash — đủ chậm để khó brute-force

### 2.5.3 HTTPS và TLS

HTTPS = HTTP + TLS (Transport Layer Security). TLS mã hóa dữ liệu trong quá trình truyền, ngăn chặn:
- **Eavesdropping**: Nghe lén traffic
- **Man-in-the-Middle**: Giả mạo server

Let's Encrypt cung cấp TLS certificate miễn phí, tự động gia hạn qua Certbot.

---

## 2.6 Container hóa với Docker

**Docker** là nền tảng container hóa, đóng gói ứng dụng và dependencies thành image có thể chạy nhất quán ở mọi môi trường.

**Docker Compose** cho phép định nghĩa và chạy nhiều container cùng lúc qua một file YAML. Trong hệ thống này, Docker Compose quản lý 7 services:

| Service | Image | Vai trò |
|---------|-------|---------|
| postgres | postgres:16-alpine | Lưu trữ dữ liệu chính |
| redis | redis:7-alpine | Cache giỏ hàng, blacklist |
| rabbitmq | rabbitmq:3-management | Message queue |
| backend | Custom NestJS image | REST API + WebSocket |
| ai-service | Custom FastAPI image | AI chatbot |
| frontend | Custom Next.js image | Web interface |

**Nginx** đóng vai trò Reverse Proxy, nhận mọi request từ internet và định tuyến đến service phù hợp, đồng thời xử lý SSL termination.
