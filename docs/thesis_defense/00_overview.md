# TỔNG QUAN DỰ ÁN - MULTI-VENDOR E-COMMERCE PLATFORM

> **Tài liệu này dành cho mục đích bảo vệ đồ án**  
> Được tổ chức theo trình tự từ kiến trúc tổng thể → chi tiết từng module

---

## Mục lục tài liệu bảo vệ

| File | Nội dung |
|------|----------|
| `01_architecture.md` | Kiến trúc hệ thống, công nghệ, Docker |
| `02_database.md` | Database schema, ERD, thiết kế dữ liệu |
| `03_auth.md` | Authentication: JWT, Google OAuth, Refresh Token |
| `04_cart_and_orders.md` | Giỏ hàng (Redis), Đặt hàng (RabbitMQ), Thanh toán (SePay) |
| `05_realtime.md` | WebSocket: Thông báo, tracking đơn hàng, chat realtime |
| `06_ai_chatbot.md` | AI Chatbot (DeepSeek), hệ thống gợi ý sản phẩm |
| `07_frontend.md` | Frontend Next.js: State management (Zustand), Middleware bảo vệ route |
| `08_shipper_app.md` | Ứng dụng shipper (React Native Expo) |

---

## Giới thiệu dự án trong 2 phút

**ProjectIII** là một **sàn thương mại điện tử đa nhà bán (Multi-Vendor E-Commerce Platform)** — tương tự mô hình thu nhỏ của Shopee/Tiki.

### Những gì hệ thống làm được:

1. **Khách hàng** duyệt sản phẩm từ nhiều shop, thêm giỏ hàng, đặt mua, thanh toán (COD hoặc qua SePay), theo dõi vận chuyển realtime, chat với shop/AI, xem gợi ý sản phẩm cá nhân hóa.

2. **Vendor (nhà bán)** đăng ký shop, quản lý sản phẩm, xem và cập nhật trạng thái đơn hàng, chat với khách hàng, bật/tắt AI trả lời tự động.

3. **Shipper** dùng app di động (React Native) để xem danh sách đơn cần giao, cập nhật tracking event theo từng bước vận chuyển.

4. **Admin** quản lý toàn hệ thống: duyệt shop, quản lý user, xem báo cáo doanh thu.

---

## Kiến trúc tổng thể (Sơ đồ)

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (Port 443)
                    ┌──────▼──────┐
                    │    Nginx    │ Reverse Proxy + SSL
                    │  (Let's    │ Certbot HTTPS
                    │  Encrypt)  │
                    └──┬────┬────┘
                       │    │
          ┌────────────▼─┐  └──────────────┐
          │  Frontend    │                  │
          │  Next.js 15  │                  │
          │  (Port 3001) │                  │
          └──────────────┘                  │
                                   ┌────────▼──────────┐
                                   │    Backend         │
                                   │    NestJS 10       │
                                   │    (Port 3005)     │
                                   │                    │
                                   │  ┌──────────────┐  │
                                   │  │ REST API     │  │
                                   │  │ WebSocket    │  │
                                   │  │ (Socket.IO)  │  │
                                   │  └──────────────┘  │
                                   └────┬───┬───┬───────┘
                                        │   │   │
                          ┌─────────────▼─┐ │  ┌▼──────────────┐
                          │  PostgreSQL   │ │  │  Redis         │
                          │  (Database)   │ │  │  (Cart cache)  │
                          └───────────────┘ │  └───────────────┘
                                           │
                                   ┌───────▼─────────┐
                                   │   RabbitMQ      │
                                   │  (Message Queue)│
                                   └───────┬─────────┘
                                           │
                                   ┌───────▼─────────┐
                                   │   AI Service    │
                                   │   FastAPI       │
                                   │   + DeepSeek    │
                                   └─────────────────┘

┌─────────────────────┐
│  Shipper App        │
│  React Native Expo  │ ──── gọi Backend API
│  (Mobile)           │
└─────────────────────┘
```

---

## Tech Stack

| Layer | Công nghệ | Phiên bản | Lý do chọn |
|-------|-----------|-----------|------------|
| **Backend** | NestJS | 10.x | Framework TypeScript chuyên nghiệp, module-based, có DI |
| **ORM** | Prisma | 5.x | Type-safe queries, migration tự động, dễ quản lý schema |
| **Database** | PostgreSQL | 16 | Relational, ACID, mạnh về JSON và quan hệ phức tạp |
| **Cache/Queue data** | Redis | 7 | In-memory, tốc độ cao cho giỏ hàng, blacklist token |
| **Message Broker** | RabbitMQ | 3 | Async processing cho đơn hàng, đảm bảo không mất message |
| **Frontend** | Next.js | 15 | SSR/SSG, App Router, tối ưu SEO |
| **State Management** | Zustand | 5 | Nhẹ, đơn giản, không boilerplate như Redux |
| **Realtime** | Socket.IO | - | WebSocket với fallback polling, phù hợp notification |
| **AI Service** | FastAPI + Python | - | Async, phù hợp AI workload |
| **LLM** | DeepSeek API | - | Chi phí thấp, tiếng Việt tốt |
| **Payment** | SePay | - | Cổng thanh toán Việt Nam |
| **Mobile** | React Native Expo | - | Cross-platform, share knowledge với React |
| **Infrastructure** | Docker + Docker Compose | - | Container hóa, dễ deploy |
| **Reverse Proxy** | Nginx | - | Load balancing, SSL termination |

---

## 5 điểm mạnh của dự án (nên nhớ khi trình bày)

1. **Kiến trúc Microservice nhẹ**: Backend + AI Service tách biệt, giao tiếp qua HTTP và RabbitMQ
2. **Async Order Processing**: Đặt hàng qua RabbitMQ → không block user, xử lý có transaction
3. **Realtime full-duplex**: Socket.IO cho thông báo đơn hàng, tracking, chat
4. **AI-powered**: Chatbot tích hợp DeepSeek LLM, gợi ý sản phẩm theo hành vi người dùng
5. **Production-ready**: Docker, Nginx, HTTPS, JWT Refresh Token blacklist với Redis

---

## Luồng người dùng chính

```
Đăng ký/Đăng nhập (JWT + Google OAuth)
↓
Duyệt sản phẩm (search, filter, gợi ý AI)
↓
Chat với shop (AI auto-reply hoặc shop owner trả lời)
↓
Thêm vào giỏ hàng (lưu Redis)
↓
Checkout (chọn địa chỉ, coupon, phương thức thanh toán)
↓
RabbitMQ xử lý async → Tạo đơn hàng (Prisma Transaction)
↓
Socket.IO thông báo kết quả checkout realtime
↓
Shop cập nhật trạng thái → Shipper app pickup & deliver
↓
Tracking realtime qua WebSocket
↓
Nhận hàng → Đánh giá sản phẩm
```

---

## Cấu trúc thư mục dự án

```
ProjectIII/
├── backend/           # NestJS - API Server chính
│   ├── src/
│   │   ├── auth/          # Authentication (JWT, Google OAuth)
│   │   ├── cart/          # Giỏ hàng (Redis-backed)
│   │   ├── orders/        # Đặt hàng + RabbitMQ Processor
│   │   ├── chat/          # Chat + AI integration
│   │   ├── tracking/      # Tracking vận chuyển
│   │   ├── notifications/ # WebSocket Gateway
│   │   ├── recommendations/ # Gợi ý sản phẩm
│   │   ├── products/      # Quản lý sản phẩm
│   │   ├── shops/         # Quản lý shop
│   │   ├── reviews/       # Đánh giá
│   │   ├── coupons/       # Mã giảm giá
│   │   ├── users/         # Quản lý người dùng
│   │   ├── redis/         # Redis service wrapper
│   │   ├── prisma/        # Prisma service
│   │   └── admin-analytics/ # Báo cáo Admin
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── seed.ts        # Dữ liệu mẫu
│
├── frontend/          # Next.js 15 - Web App
│   ├── app/           # App Router
│   ├── components/    # React Components
│   ├── store/         # Zustand state management
│   ├── services/      # API call wrappers
│   └── middleware.ts  # Route protection
│
├── ai-service/        # FastAPI - AI Chatbot
│   ├── main.py        # Entry point
│   └── routers/chat.py # Chat endpoint với DeepSeek
│
├── shipper-app/       # React Native Expo - Mobile App
│
└── docker-compose.yml # Orchestration
```
