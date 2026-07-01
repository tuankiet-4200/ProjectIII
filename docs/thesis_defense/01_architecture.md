# KIẾN TRÚC HỆ THỐNG - Infrastructure & DevOps

---

## 1. Docker & Container Architecture

### docker-compose.yml (Development)

```
┌─────────────────────────────────────────────────┐
│              Docker Network (internal)            │
│                                                   │
│  postgres:5432 ──────────────────────────────┐   │
│  redis:6379    ──────────────── backend:3000 │   │
│  rabbitmq:5672 ──────────────────────────────┘   │
│  ai-service:8000 ────────────────────────────┘   │
│                                                   │
│  frontend:3000 → (exposed as 3001)                │
│  backend:3000  → (exposed as 3005)                │
└─────────────────────────────────────────────────┘
```

**Service Dependencies** (`depends_on`):
```yaml
backend:
  depends_on:
    - postgres   # DB phải lên trước
    - redis      # Cache phải lên trước
    - rabbitmq   # Queue phải lên trước
    - ai-service # AI phải lên trước

frontend:
  depends_on:
    - backend    # API phải lên trước
```

### Volume Persistence

```yaml
volumes:
  postgres_data:  # Named volume → data tồn tại qua restart
# Redis và RabbitMQ không có volume → mất data khi restart (OK cho development)
```

---

## 2. Production Setup (Nginx + HTTPS)

### Tại sao cần Nginx?

```
Client ─── HTTPS:443 ──► Nginx ─┬─ /api/* ──► Backend:3005
                                 ├─ /socket.io/* → Backend:3005 (WebSocket)
                                 └─ /* ────────► Frontend:3001
```

**Lợi ích Nginx làm Reverse Proxy:**
1. **SSL Termination**: Nginx xử lý HTTPS → các service nội bộ dùng HTTP (đơn giản hơn)
2. **Single entry point**: Mọi traffic qua port 443 → ẩn cấu trúc nội bộ
3. **Security**: Database, Redis không lộ ra ngoài
4. **Load balancing** (có thể scale sau)

### Nginx WebSocket Configuration

```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:3005/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;     # Bắt buộc cho WebSocket
    proxy_set_header Connection "upgrade";       # HTTP → WebSocket upgrade
    proxy_set_header Host $host;
}
```

**Tại sao cần `Upgrade` và `Connection` headers?**  
WebSocket bắt đầu bằng HTTP handshake (`Upgrade: websocket`). Nginx mặc định không forward headers này → WebSocket fail. 2 headers trên báo Nginx "đây là WebSocket connection, hãy forward đúng cách".

### Let's Encrypt (Certbot)

```bash
sudo certbot --nginx -d demoserver.io.vn
```

Certbot tự động:
1. Tạo challenge file để verify domain ownership
2. Lấy certificate từ Let's Encrypt CA
3. Cấu hình Nginx thêm `ssl_certificate`, redirect HTTP→HTTPS
4. Setup auto-renew (certificate hết hạn sau 90 ngày)

---

## 3. Kiến trúc Backend (NestJS Modules)

```
AppModule (root)
├── ConfigModule     → Đọc .env, global
├── PrismaModule     → Database connection, global
├── RedisModule      → Redis connection, global
├── AuthModule       → Auth logic + JWT strategy
├── UsersModule      → User CRUD
├── ShopsModule      → Shop management
├── CategoriesModule → Category tree
├── ProductsModule   → Product CRUD + search
├── CartModule       → Redis cart operations
├── OrdersModule     → Order + RabbitMQ producer + processor
├── NotificationsModule → Socket.IO gateway
├── TrackingModule   → Delivery tracking
├── ChatModule       → Chat + AI integration
├── ReviewsModule    → Product reviews
├── CouponsModule    → Coupon management
├── WishlistModule   → User wishlist
├── RecommendationsModule → AI recommendations
├── HomeContentModule → Homepage banners
├── AdminAnalyticsModule → Admin dashboard stats
└── UploadsModule    → File upload handling
```

**NestJS Dependency Injection:**
```typescript
// PrismaModule cung cấp PrismaService
// AuthModule import PrismaModule → dùng được PrismaService
@Module({
  imports: [PrismaModule, JwtModule],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],  // Cho các module khác dùng
})
export class AuthModule {}
```

---

## 4. main.ts - Entry Point và Cấu hình

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Global route prefix → mọi route đều có /api
  app.setGlobalPrefix('api');

  // 2. Global ValidationPipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,          // Strip unknown fields khỏi DTO
    forbidNonWhitelisted: true, // Error nếu có field không khai báo trong DTO
    transform: true,          // Tự convert string → number, string → Date
  }));

  // 3. CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') || '*',
    // Split(',') → hỗ trợ nhiều domain (staging + production)
    credentials: true,  // Cho phép gửi cookie cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // 4. Static files → serve uploaded images
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // 5. RabbitMQ Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'orders_queue',
      queueOptions: { durable: true },  // Queue tồn tại qua RabbitMQ restart
    },
  });

  await app.startAllMicroservices();  // Bắt đầu lắng nghe RabbitMQ
  await app.listen(3000);             // Bắt đầu HTTP server
}
```

---

## 5. Câu hỏi về Kiến trúc

### Q1: Tại sao chọn NestJS thay vì Express thuần?
**A:** NestJS = Express + TypeScript + Module system + DI container + decorator pattern. Express quá linh hoạt → không có cấu trúc chuẩn → code dễ rối. NestJS enforce structure (Module/Controller/Service) → code dễ maintain, dễ test, dễ scale. Phù hợp team lớn và dự án phức tạp.

### Q2: `durable: true` trong RabbitMQ là gì?
**A:** Queue với `durable: true` được lưu vào disk → tồn tại qua RabbitMQ restart. Nếu `durable: false` → queue mất khi restart → tất cả messages chưa xử lý bị mất. Trong e-commerce, mất đơn hàng là nghiêm trọng → bắt buộc `durable: true`.

### Q3: `whitelist: true` trong ValidationPipe nghĩa gì?
**A:** Nếu user gửi `{ email, password, is_admin: true }` mà DTO không khai báo `is_admin` → Prisma sẽ bỏ qua field không khai báo, nhưng để an toàn hơn `whitelist: true` + `forbidNonWhitelisted: true` sẽ throw error ngay → phát hiện client đang cố inject field lạ.

### Q4: Tại sao Backend có thể vừa là HTTP server vừa là RabbitMQ consumer?
**A:** NestJS hỗ trợ **Hybrid Application** — `NestFactory.create()` tạo HTTP app, `app.connectMicroservice()` thêm RabbitMQ consumer vào cùng process. Cả 2 chạy song song trong cùng 1 Node.js process. `OrdersProcessor` dùng `@EventPattern` nhận từ queue, còn `OrdersController` xử lý HTTP routes.

### Q5: Nếu Backend crash giữa chừng khi đang xử lý RabbitMQ message thì sao?
**A:** RabbitMQ có **ACK mechanism**. Khi message được deliver đến consumer, RabbitMQ đợi ACK. Nếu consumer crash trước khi ACK → RabbitMQ re-deliver message khi consumer reconnect. Với NestJS RMQ transport, ACK tự động sau khi handler chạy xong. Nếu handler throw exception → **nack** → message có thể vào Dead Letter Queue.

---

## 6. Tóm tắt Kiến trúc

```
PRESENTATION LAYER
  Frontend (Next.js)      Shipper App (React Native)
        ↓ HTTP/WebSocket         ↓ HTTP
INFRASTRUCTURE LAYER
  Nginx (Reverse Proxy + SSL)
        ↓
APPLICATION LAYER
  Backend NestJS (REST API + WebSocket Gateway + RabbitMQ Consumer)
        ↓              ↓              ↓
  PostgreSQL         Redis         RabbitMQ ──► (async processing)
  (persistent)       (cache)       (queue)
        ↓                                         ↓
  AI Service FastAPI ← ─ ─ ─ ─ HTTP ─ ─ ─ ─ ─ ─ ┘
  (DeepSeek LLM)
```

**Pattern được áp dụng:**
- **Module Pattern** (NestJS)
- **Repository Pattern** (PrismaService đóng vai repository)
- **Service Pattern** (business logic trong Service layer)
- **Dependency Injection** (NestJS IoC container)
- **Event-Driven Architecture** (RabbitMQ cho order processing)
- **Gateway Pattern** (Socket.IO gateway cho realtime)
- **Adapter Pattern** (SepayCheckoutService wrap SePay SDK)
