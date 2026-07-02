# CHƯƠNG 4: CÀI ĐẶT VÀ TRIỂN KHAI

---

## 4.1 Môi trường phát triển

### 4.1.1 Yêu cầu hệ thống

| Thành phần | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Node.js | 20.x LTS | Runtime cho Backend và Frontend |
| Python | 3.11 | Runtime cho AI Service |
| Docker | 24.x | Container runtime |
| Docker Compose | 2.x | Multi-container orchestration |
| PostgreSQL | 16 | Database chính |
| Redis | 7 | In-memory cache |
| RabbitMQ | 3-management | Message broker |

### 4.1.2 Cấu trúc thư mục dự án

```
ProjectIII/
├── backend/           # NestJS API Server
│   ├── src/
│   │   ├── auth/      # Authentication module
│   │   ├── cart/      # Cart module (Redis)
│   │   ├── orders/    # Order + RabbitMQ
│   │   ├── chat/      # Chat + AI
│   │   ├── notifications/ # WebSocket Gateway
│   │   └── ...        # Các module khác
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/          # Next.js Web App
│   ├── app/           # App Router
│   ├── components/    # React Components
│   ├── store/         # Zustand stores
│   ├── services/      # API clients
│   └── middleware.ts  # Route protection
├── ai-service/        # FastAPI AI Service
│   ├── main.py
│   └── routers/
│       └── chat.py
├── shipper-app/       # React Native Expo
│   └── src/
│       ├── screens/
│       └── services/
├── docker-compose.yml         # Development
├── docker-compose.prod.yml    # Production
└── .env.example
```

---

## 4.2 Cài đặt Backend (NestJS)

### 4.2.1 Khởi tạo ứng dụng — main.ts

File `main.ts` là entry point của ứng dụng NestJS, thực hiện các cấu hình toàn cục:

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Prefix toàn cục — tất cả routes đều có /api
  app.setGlobalPrefix('api');

  // 2. Validation Pipe toàn cục
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Loại bỏ field không khai báo trong DTO
    forbidNonWhitelisted: true,// Báo lỗi nếu có field lạ
    transform: true,           // Tự convert types (string → number)
  }));

  // 3. CORS — cho phép Frontend gọi API
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') || '*',
    credentials: true,
  });

  // 4. Serve static files (ảnh upload)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // 5. Kết nối RabbitMQ Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'orders_queue',
      queueOptions: { durable: true }, // Tồn tại qua restart
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3000);
}
```

### 4.2.2 Cài đặt Authentication

**Đăng ký tài khoản** (`auth.service.ts`):

```typescript
async register(dto: RegisterDto) {
  // 1. Kiểm tra trùng email/phone
  const existingUser = await this.prisma.user.findUnique({
    where: { email: dto.email }
  });
  if (existingUser) throw new ConflictException('Email already registered');

  // 2. Hash password với bcrypt (cost factor 10)
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(dto.password, salt);

  // 3. Tạo user trong database
  const user = await this.prisma.user.create({
    data: { email: dto.email, password_hash, full_name: dto.full_name,
            phone: dto.phone, role: 'CUSTOMER' }
  });

  // 4. Cấp token và trả về
  return { user: this.toPublicUser(user), ...await this.generateTokens(...) };
}
```

**Cơ chế Refresh Token Blacklist** với Redis:

```typescript
async logout(refreshToken: string) {
  const payload = this.jwtService.verify(refreshToken, {
    secret: this.configService.get('JWT_REFRESH_SECRET'),
  });

  // Tính TTL bằng thời gian còn lại của token
  const ttl = Math.max(Number(payload.exp) - Math.floor(Date.now() / 1000), 0);

  if (ttl > 0) {
    // Hash token SHA256 trước khi lưu Redis (tiết kiệm bộ nhớ, bảo mật)
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.redisService.set(`auth:blacklist:refresh:${tokenHash}`, '1', ttl);
  }
  return { message: 'Logged out successfully' };
}
```

### 4.2.3 Cài đặt Giỏ hàng với Redis

Giỏ hàng được lưu dạng Redis Hash với key `cart:{userId}`, field là `productId`, value là `quantity`:

```typescript
async addItem(userId: string, dto: AddToCartDto) {
  // 1. Validate sản phẩm tồn tại và còn hàng
  const product = await this.prisma.product.findUnique({
    where: { id: dto.product_id }
  });
  if (!product) throw new NotFoundException('Product not found');
  if (product.stock_quantity < dto.quantity)
    throw new BadRequestException('Not enough stock');

  // 2. Kiểm tra tổng quantity trong cart không vượt stock
  const currentQty = await this.redis.hget(`cart:${userId}`, dto.product_id);
  const newQty = (currentQty ? parseInt(currentQty) : 0) + dto.quantity;
  if (newQty > product.stock_quantity)
    throw new BadRequestException('Exceeds available stock');

  // 3. Lưu vào Redis Hash
  await this.redis.hset(`cart:${userId}`, dto.product_id, newQty.toString());

  // 4. Ghi nhận tương tác cho recommendation
  await this.prisma.userInteraction.create({
    data: { user_id: userId, product_id: dto.product_id,
            interaction_type: 'ADD_TO_CART' }
  });
}
```

### 4.2.4 Cài đặt Order Processing với RabbitMQ

**Processor nhận message từ queue** (`orders.processor.ts`):

```typescript
@Controller()
export class OrdersProcessor {
  @EventPattern('order.create')  // Lắng nghe event từ queue
  async handleOrderCreate(@Payload() data: any) {
    const { userId, parentOrderId, dto, cartData } = data;

    try {
      // Chạy trong Prisma Transaction — all or nothing
      const result = await this.prisma.$transaction(async (tx) => {

        // Xử lý coupon nếu có
        let discountAmount = 0;
        if (dto.coupon_code) {
          const coupon = await tx.coupon.findUnique({
            where: { code: dto.coupon_code.toUpperCase() }
          });
          if (coupon?.is_active) {
            // Tính discount + ghi nhận usage trong cùng transaction
            discountAmount = this.calcDiscount(coupon, totalAmount);
            await tx.coupon.update({ where: { code: coupon.code },
              data: { used_count: { increment: 1 } } });
            await tx.couponUsage.create({
              data: { coupon_id: coupon.id, user_id: userId } });
          }
        }

        // Tính toán tổng đơn hàng
        const totals = calculateOrderTotals(totalPayment, discountAmount);
        await tx.parentOrder.update({ where: { id: parentOrderId },
          data: { total_payment: totals.total } });

        // Tạo đơn hàng con và trừ tồn kho với Optimistic Lock
        for (const group of shopGroups.values()) {
          const shopOrder = await tx.shopOrder.create({ ... });

          for (const item of group.items) {
            await tx.orderItem.create({ ... });

            // Optimistic Lock: chỉ update nếu còn đủ hàng
            const updated = await tx.product.updateMany({
              where: { id: item.product.id,
                        stock_quantity: { gte: item.quantity } },
              data: { stock_quantity: { decrement: item.quantity },
                      sales_count: { increment: item.quantity } }
            });

            if (updated.count === 0)
              throw new Error(`Sản phẩm "${item.product.name}" đã hết hàng.`);
          }
        }
        return { totals, shopOrders };
      }); // Transaction kết thúc — commit nếu không throw

      // Thông báo thành công qua WebSocket
      this.notifications.server.to(`user_${userId}`)
        .emit('order_checkout_success', { parentOrderId, totalPayment: result.totals.total });

    } catch (error) {
      // Rollback đã tự động do transaction throw
      await this.prisma.parentOrder.delete({ where: { id: parentOrderId } }).catch(() => {});
      this.notifications.server.to(`user_${userId}`)
        .emit('order_checkout_failed', { message: error.message });
    }
  }
}
```

### 4.2.5 Cài đặt WebSocket Gateway

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: Server;
  private userSockets: Map<string, string[]> = new Map();

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) { client.disconnect(); return; }

    try {
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      // Join vào room riêng của user — cốt lõi của targeted notification
      client.join(`user_${userId}`);
      const sockets = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, [...sockets, client.id]);
    } catch {
      client.disconnect(); // Token không hợp lệ → từ chối kết nối
    }
  }

  emitOrderStatusChanged(userId: string, payload: any) {
    // Emit đến tất cả socket của user — bao gồm nhiều tab
    this.server.to(`user_${userId}`).emit('orderStatusChanged', payload);
  }
}
```

---

## 4.3 Cài đặt AI Chatbot Service

### 4.3.1 Cơ chế Keyword Context Injection

Trước khi gọi DeepSeek API, backend trích xuất từ khóa từ tin nhắn và query sản phẩm liên quan:

```typescript
// chat.service.ts

private extractProductKeywords(message: string): string[] {
  const STOPWORDS = new Set(['shop', 'có', 'bán', 'giá', 'hàng', ...]);

  return [...new Set(
    message
      .toLowerCase()
      .normalize('NFC')                       // Chuẩn hóa Unicode tiếng Việt
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')     // Xóa ký tự đặc biệt
      .split(/\s+/)
      .filter(w => w.length >= 2)
      .filter(w => !STOPWORDS.has(w))
  )].slice(0, 5);                             // Tối đa 5 keywords
}

private async getShopProductsContext(shopId: string, message: string) {
  const keywords = this.extractProductKeywords(message);

  return this.prisma.product.findMany({
    where: {
      shop_id: shopId,
      OR: keywords.flatMap(kw => [
        { name: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
      ]),
    },
    orderBy: [{ sales_count: 'desc' }],
    take: 8,
    select: { name: true, price: true, stock_quantity: true, description: true, slug: true }
  });
}
```

### 4.3.2 Gọi DeepSeek API (Python FastAPI)

```python
# routers/chat.py

@router.post("/predict")
async def predict_chat(request: ChatRequest):
    products_str = format_products_context(request.products_context)

    system_prompt = f"""Bạn là nhân viên CSKH của {request.shop_name}.
Danh sách sản phẩm liên quan từ hệ thống:
---
{products_str}
---
Chỉ tư vấn sản phẩm có trong danh sách trên. Không bịa đặt giá, tồn kho."""

    # Build conversation history (OpenAI format)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.history:
        messages.append({
            "role": "user" if msg["role"] == "user" else "assistant",
            "content": msg["parts"][0]
        })
    messages.append({"role": "user", "content": request.message})

    # Gọi DeepSeek API
    response = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
        json={"model": DEEPSEEK_MODEL, "messages": messages, "stream": False},
        timeout=30
    )
    return ChatResponse(reply=response.json()['choices'][0]['message']['content'])
```

**AI chạy bất đồng bộ** — không block HTTP response:

```typescript
// Ngay sau khi lưu tin nhắn user, trả response về luôn
// AI chạy trong IIFE async, kết quả đến qua WebSocket

(async () => {
  try {
    const aiReply = await fetch(`${AI_SERVICE_URL}/chat/predict`, { ... });
    const botMessage = await this.prisma.chatMessage.create({
      data: { sender_type: 'BOT', message_text: aiReply.reply }
    });
    this.notificationsGateway.emitChatMessage(userId, botMessage);
  } catch (e) {
    console.error("AI error:", e); // Lỗi không ảnh hưởng response đã trả
  }
})(); // IIFE — chạy ngay, không await
```

---

## 4.4 Cài đặt Frontend (Next.js)

### 4.4.1 Middleware bảo vệ route

```typescript
// middleware.ts — chạy tại Edge Runtime (không có Node.js)

function decodeJwt(token: string) {
  // Decode base64url payload — KHÔNG verify signature (Edge không hỗ trợ)
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (pathname.startsWith("/admin")) {
    if (!token) return redirectToLogin("unauthenticated");
    const payload = decodeJwt(token);
    if (Date.now() >= payload.exp * 1000) return redirectToLogin("session_expired");
    if (payload.role !== "ADMIN") return redirectToLogin("forbidden");
  }
  // ... tương tự cho /vendor, /checkout, /orders
}
```

### 4.4.2 Zustand State Management

```typescript
// store/useAuthStore.ts — Persist sang localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: async () => {
        await authService.logout(get().refreshToken); // Blacklist ở backend
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        // Xóa cookie để middleware reset
        document.cookie = 'access_token=; path=/; max-age=0';
      },
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => localStorage) }
  )
);
```

---

## 4.5 Triển khai Production

### 4.5.1 Docker Compose Production

```yaml
# docker-compose.prod.yml
services:
  backend:
    image: projectiii-backend
    ports:
      - "127.0.0.1:3005:3000"  # Chỉ localhost, không lộ ra internet
    environment:
      - DATABASE_URL=${BACKEND_DATABASE_URL}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - RABBITMQ_URL=${RABBITMQ_URL}

  postgres:
    image: postgres:16-alpine
    ports:
      - "127.0.0.1:5432:5432"  # Database không lộ ra internet
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Data persist

  # ... các service khác
```

### 4.5.2 Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name demoserver.io.vn www.demoserver.io.vn;
    return 301 https://$host$request_uri;  # Redirect HTTP → HTTPS
}

server {
    listen 443 ssl;
    server_name demoserver.io.vn;

    ssl_certificate /etc/letsencrypt/live/demoserver.io.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demoserver.io.vn/privkey.pem;

    client_max_body_size 50M;  # Cho phép upload file lớn

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3005/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3005/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;    # Bắt buộc cho WebSocket
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

### 4.5.3 Quy trình triển khai

```bash
# 1. Clone project lên VPS
git clone https://github.com/... ~/kietnt/ProjectIII
cd ~/kietnt/ProjectIII

# 2. Cấu hình environment
cp .env.example .env
nano .env  # Điền các giá trị thực

# 3. Build và khởi động các services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Chạy database migration và seed data
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec backend npm run db:seed

# 5. Cài Nginx và cấu hình
sudo apt install nginx
sudo nano /etc/nginx/sites-available/projectiii
sudo ln -s /etc/nginx/sites-available/projectiii /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Cấp HTTPS certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d demoserver.io.vn -d www.demoserver.io.vn
```

### 4.5.4 Thông tin hệ thống production

| Thông tin | Giá trị |
|-----------|---------|
| VPS Provider | VinaHost |
| Địa chỉ IP | 103.82.24.142 |
| Domain | demoserver.io.vn |
| SSL Certificate | Let's Encrypt (tự động gia hạn) |
| OS | Ubuntu 22.04 LTS |
