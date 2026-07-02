# TÀI LIỆU THAM KHẢO

---

[1] NestJS Documentation. *NestJS — A progressive Node.js framework*. https://docs.nestjs.com (Truy cập: 2024)

[2] Prisma Documentation. *Prisma ORM — Next-generation Node.js and TypeScript ORM*. https://www.prisma.io/docs (Truy cập: 2024)

[3] PostgreSQL Global Development Group. *PostgreSQL 16 Documentation*. https://www.postgresql.org/docs/16/ (Truy cập: 2024)

[4] Redis Documentation. *Redis — The open-source, in-memory data store*. https://redis.io/docs (Truy cập: 2024)

[5] RabbitMQ Documentation. *RabbitMQ — Messaging that just works*. https://www.rabbitmq.com/docs (Truy cập: 2024)

[6] Next.js Documentation. *Next.js — The React Framework for the Web*. https://nextjs.org/docs (Truy cập: 2024)

[7] Socket.IO Documentation. *Socket.IO — Bidirectional and low-latency communication*. https://socket.io/docs (Truy cập: 2024)

[8] Zustand Documentation. *Zustand — Bear necessities for state management*. https://zustand-demo.pmnd.rs (Truy cập: 2024)

[9] DeepSeek API Documentation. *DeepSeek API — OpenAI-compatible LLM API*. https://platform.deepseek.com/api-docs (Truy cập: 2024)

[10] FastAPI Documentation. *FastAPI — Modern, fast web framework for Python*. https://fastapi.tiangolo.com (Truy cập: 2024)

[11] Docker Documentation. *Docker — Containerization platform*. https://docs.docker.com (Truy cập: 2024)

[12] Let's Encrypt. *Let's Encrypt — A free, automated Certificate Authority*. https://letsencrypt.org/docs (Truy cập: 2024)

[13] Provos, N. & Mazieres, D. (1999). *A future-adaptable password scheme*. USENIX Annual Technical Conference. (bcrypt algorithm)

[14] Jones, M., Bradley, J. & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519. Internet Engineering Task Force (IETF).

[15] VECOM. (2023). *Báo cáo Thương mại điện tử Việt Nam 2023*. Hiệp hội Thương mại Điện tử Việt Nam.

[16] Expo Documentation. *Expo — An open-source platform for React Native apps*. https://docs.expo.dev (Truy cập: 2024)

[17] Lewis, J. & Fowler, M. (2014). *Microservices: a definition of this new architectural term*. https://martinfowler.com/articles/microservices.html

[18] Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media. (Chương về Message Queues và Event-Driven Architecture)

[19] Nginx Documentation. *NGINX — High Performance Load Balancer, Web Server, Reverse Proxy*. https://nginx.org/en/docs (Truy cập: 2024)

[20] Google LLC. *Google OAuth 2.0 for Web Server Applications*. https://developers.google.com/identity/protocols/oauth2/web-server (Truy cập: 2024)

---

# PHỤ LỤC

## Phụ lục A: Cấu hình môi trường (Environment Variables)

```env
# ===== DATABASE =====
BACKEND_DATABASE_URL=postgresql://user:password@postgres:5432/projectiii

# ===== REDIS =====
REDIS_HOST=redis
REDIS_PORT=6379

# ===== JWT Authentication =====
JWT_ACCESS_SECRET=your_access_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://demoserver.io.vn/api/auth/google/callback

# ===== RabbitMQ =====
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# ===== AI Service =====
AI_SERVICE_URL=http://ai-service:8000
DEEPSEEK_API_KEY=your_deepseek_api_key

# ===== Payment =====
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_ENV=sandbox

# ===== URLs =====
FRONTEND_URL=https://demoserver.io.vn
BACKEND_URL=https://demoserver.io.vn
```

## Phụ lục B: Lệnh khởi động Development

```bash
# 1. Clone và cài đặt dependencies
git clone <repo_url> ProjectIII
cd ProjectIII

# 2. Khởi động các service cơ sở hạ tầng
docker compose up -d postgres redis rabbitmq

# 3. Chạy Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# 4. Chạy AI Service
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 5. Chạy Frontend
cd frontend
npm install
npm run dev

# 6. Chạy Shipper App
cd shipper-app
npm install
npx expo start
```

## Phụ lục C: Sơ đồ Database hoàn chỉnh

```
users                     shops
├── id (UUID PK)          ├── id (UUID PK)
├── email (UNIQUE)        ├── owner_id → users.id
├── password_hash         ├── name, description
├── full_name             ├── logo_url, rating
├── phone (UNIQUE)        ├── status (ENUM)
├── role (ENUM)           └── ai_auto_respond (BOOL)
└── is_banned (BOOL)

products                  categories
├── id (UUID PK)          ├── id (INT PK)
├── shop_id → shops.id    ├── name, slug (UNIQUE)
├── category_id           ├── parent_id → categories.id
├── name, slug (UNIQUE)   └── icon, description
├── price, stock_quantity
├── images (TEXT[])
└── features (TEXT[])

parent_orders             shop_orders
├── id (UUID PK)          ├── id (UUID PK)
├── user_id → users.id    ├── parent_order_id
├── total_payment         ├── shop_id → shops.id
├── payment_status (ENUM) ├── shipping_fee
└── payment_method (ENUM) └── status (ENUM)

order_items               tracking_events
├── id (UUID PK)          ├── id (UUID PK)
├── shop_order_id         ├── shop_order_id
├── product_id            ├── shipper_id → users.id
├── quantity              ├── event_type
└── price_at_purchase     ├── location
                          └── proof_image_url

chat_sessions             chat_messages
├── id (UUID PK)          ├── id (UUID PK)
├── user_id → users.id    ├── session_id
├── shop_id → shops.id    ├── sender_type (ENUM)
└── status (ENUM)         └── message_text

user_interactions         coupons
├── id (UUID PK)          ├── id (UUID PK)
├── user_id → users.id    ├── shop_id → shops.id (nullable)
├── product_id            ├── code (UNIQUE)
└── interaction_type      ├── type (ENUM: PERCENTAGE/FIXED)
                          ├── value, min_order_amount
                          ├── usage_limit, used_count
                          └── expires_at
```
