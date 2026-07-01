# AUTHENTICATION MODULE - Phân tích chi tiết

---

## 1. Chức năng

Module `auth` xử lý **toàn bộ vấn đề xác thực** của hệ thống:
- Đăng ký tài khoản mới
- Đăng nhập bằng email/password
- Đăng nhập bằng Google OAuth 2.0
- Cấp mới Access Token bằng Refresh Token
- Đăng xuất (vô hiệu hóa Refresh Token bằng Redis Blacklist)

**Thuộc module**: `AuthModule` — NestJS Module độc lập  
**Người dùng sử dụng khi nào**: Lần đầu dùng ứng dụng, hoặc khi access token hết hạn

---

## 2. Luồng hoạt động

### 2.1 Đăng ký (Register)

```
User điền form đăng ký
↓
Frontend gọi POST /api/auth/register { email, password, full_name, phone }
↓
AuthController.register(dto) nhận request
↓
ValidationPipe kiểm tra DTO (email hợp lệ? password đủ mạnh?)
↓
AuthService.register(dto):
  1. Kiểm tra email đã tồn tại chưa (prisma.user.findUnique)
  2. Kiểm tra phone đã tồn tại chưa
  3. bcrypt.genSalt(10) + bcrypt.hash(password, salt) → password_hash
  4. prisma.user.create() → tạo user trong DB
  5. generateTokens(userId, email, role) → JWT access + refresh token
↓
Response: { user: {...}, access_token: "...", refresh_token: "..." }
↓
Frontend lưu tokens (localStorage + cookie)
↓
Redirect về trang chủ
```

### 2.2 Đăng nhập JWT (Login)

```
User điền email/password
↓
POST /api/auth/login { email, password }
↓
AuthService.login(dto):
  1. prisma.user.findUnique({ where: { email } }) → tìm user
  2. bcrypt.compare(password, user.password_hash) → verify password
  3. Nếu sai → throw UnauthorizedException("Invalid credentials")
     ← Lý do: Không nói "sai email" hay "sai password" riêng → tránh enumeration attack
  4. generateTokens() → cấp 2 token
↓
Response: { user, access_token (15m), refresh_token (7d) }
↓
Frontend lưu vào localStorage + cookie (access_token)
```

### 2.3 Đăng nhập Google OAuth

```
User click "Đăng nhập với Google"
↓
Frontend redirect đến GET /api/auth/google
↓
GoogleAuthGuard kích hoạt GoogleStrategy (passport-google-oauth20)
↓
Redirect sang Google OAuth Consent Screen
↓
User đồng ý → Google redirect về /api/auth/google/callback?code=...
↓
GoogleAuthGuard xử lý callback:
  - Exchange code → Access Token
  - Gọi Google API lấy profile (email, name, id)
  - GoogleStrategy.validate() → trả về { id, email, full_name }
↓
AuthController.googleAuthCallback():
  1. Lấy req.user (profile từ Google)
  2. Gọi AuthService.googleLogin(profile)
     - Tìm user theo email trong DB
     - Nếu chưa có → tạo user mới với password = hash(randomUUID())
     - Tạo phone placeholder: "google-{googleId}"
  3. generateTokens() → cấp JWT
  4. Redirect về Frontend: /auth/google/callback?access_token=...&refresh_token=...&user=...
↓
Frontend nhận token từ URL params → lưu vào store
```

### 2.4 Refresh Token

```
Access token hết hạn (sau 15 phút)
↓
Frontend gọi POST /api/auth/refresh { refresh_token }
↓
AuthService.refreshToken(refreshToken):
  1. Kiểm tra token trong Redis blacklist:
     key = "auth:blacklist:refresh:{sha256(token)}"
     → Nếu có trong blacklist → throw UnauthorizedException (đã logout)
  2. jwtService.verify(token, { secret: JWT_REFRESH_SECRET }) → decode payload
  3. prisma.user.findUnique({ where: { id: payload.sub } }) → user có tồn tại?
  4. generateTokens() → cấp bộ token mới
↓
Response: { access_token, refresh_token }
↓
Frontend cập nhật localStorage
```

### 2.5 Đăng xuất (Logout)

```
User click Logout
↓
POST /api/auth/logout { refresh_token }
↓
AuthService.logout(refreshToken):
  1. Verify refresh token → lấy exp (expiry timestamp)
  2. Tính TTL = exp - now (thời gian còn lại của token)
  3. Lưu vào Redis: SET "auth:blacklist:refresh:{sha256(token)}" "1" EX {ttl}
     → Token bị blacklist trong đúng thời gian nó còn hiệu lực
↓
Frontend xóa localStorage, xóa cookie
↓
User redirect về /login
```

---

## 3. Giải thích từng đoạn code

### 3.1 `auth.service.ts` - generateTokens()

```typescript
private async generateTokens(userId: string, email: string, role: string) {
  const payload = { sub: userId, email, role };
  //  ↑ "sub" là standard JWT claim, chứa user ID
  //  Không put sensitive info (password, address...) vào JWT payload
  //  vì JWT payload có thể decode mà không cần secret

  const [access_token, refresh_token] = await Promise.all([
    // Dùng Promise.all để sign 2 token song song → nhanh hơn tuần tự
    this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiration,  // mặc định "15m"
    }),
    this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      // Dùng secret KHÁC cho refresh token → nếu attacker lấy được access secret
      // thì không fake được refresh token
      expiresIn: refreshExpiration,  // mặc định "7d"
    }),
  ]);

  return { access_token, refresh_token };
}
```

**Tại sao 2 loại token?**
- **Access Token** (ngắn hạn, 15 phút): Dùng cho mọi API request. Ngắn để giảm nguy cơ bị đánh cắp
- **Refresh Token** (dài hạn, 7 ngày): Chỉ dùng để lấy access token mới. Lưu trong DB/blacklist khi logout

### 3.2 `auth.service.ts` - getRefreshTokenBlacklistKey()

```typescript
private getRefreshTokenBlacklistKey(refreshToken: string) {
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  return `auth:blacklist:refresh:${tokenHash}`;
}
```

**Tại sao hash token trước khi lưu Redis?**
- Refresh token là string dài (~200 chars). Lưu thẳng = waste memory Redis
- SHA256 luôn cho ra 64 hex chars → tiết kiệm bộ nhớ
- Nếu Redis bị leak → attacker chỉ có hash, không có token gốc

**TTL trong Redis:**  
Key được set với TTL = thời gian còn lại của token → Redis tự xóa khi token hết hạn → không tốn bộ nhớ

### 3.3 `jwt.strategy.ts` - JwtStrategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ↑ Tự động đọc token từ header: "Authorization: Bearer {token}"
      ignoreExpiration: false,
      // ↑ Bắt buộc: reject token hết hạn
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Hàm này chạy SAU KHI passport đã verify signature JWT
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    // ↑ Tại sao vẫn query DB dù đã có payload trong JWT?
    //   → Để phát hiện user bị xóa hoặc bị ban GIỮA CHỪNG
    //   → JWT có thể đã được issue nhưng user bị ban sau đó

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id, email: user.email,
      role: user.role, full_name: user.full_name,
    };
    // ↑ Object này được gán vào req.user trong mọi protected route
  }
}
```

### 3.4 `google.strategy.ts` - GoogleStrategy

```typescript
validate(_accessToken, _refreshToken, profile, done) {
  // _accessToken, _refreshToken = Google OAuth tokens → không cần, bỏ qua
  const email = profile.emails?.[0]?.value;
  // ↑ Optional chaining vì emails có thể không có (Google account ẩn email)

  done(null, {
    id: profile.id,
    email,
    full_name: profile.displayName || profile.name?.givenName || email || 'Google User',
    //     ↑ Thứ tự ưu tiên: tên đầy đủ → tên → email → 'Google User'
  });
  // done(error, user) → passport convention
}
```

### 3.5 `auth.controller.ts` - googleAuthCallback

```typescript
async googleAuthCallback(@Req() req, @Res() res: Response) {
  const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

  try {
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const authResult = await this.authService.googleLogin(req.user);
    const params = new URLSearchParams({
      access_token: authResult.access_token,
      refresh_token: authResult.refresh_token,
      user: JSON.stringify(authResult.user),
    });
    // ↑ Encode tokens vào URL params để truyền sang Frontend
    //   Đây là OAuth Authorization Code Flow redirect

    return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
    // Frontend (Next.js page /auth/google/callback) sẽ đọc params và lưu vào store
  } catch {
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
}
```

---

## 4. Dependency Graph

```
AuthController
  ├── AuthService
  │     ├── PrismaService (database)
  │     ├── JwtService (@nestjs/jwt)
  │     ├── ConfigService (@nestjs/config)
  │     └── RedisService (token blacklist)
  └── ConfigService

JwtStrategy (Passport Strategy)
  ├── ConfigService (lấy JWT_ACCESS_SECRET)
  └── PrismaService (verify user còn tồn tại)

GoogleStrategy (Passport Strategy)
  └── ConfigService (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

Guards:
  ├── JwtAuthGuard → dùng JwtStrategy
  └── GoogleAuthGuard → dùng GoogleStrategy

AuthModule exports: AuthService, JwtAuthGuard
← Các module khác import AuthModule để dùng guard bảo vệ route
```

---

## 5. Luồng dữ liệu

```
Input: { email, password } từ HTTP Request Body
↓
DTO validation (class-validator) → kiểm tra format
↓
bcrypt.compare() → verify password
↓
prisma.user.findUnique() → đọc từ PostgreSQL
↓
jwtService.signAsync() → generate JWT (HMAC-SHA256)
↓
Output: { access_token, refresh_token, user }

Khi Logout:
Token → SHA256 hash → Redis SET với TTL
→ Token bị vô hiệu hóa mà không cần query DB mỗi request
```

---

## 6. Kiến trúc

Auth module tuân theo **NestJS Module Pattern** với đầy đủ:
- **Controller** → HTTP layer, nhận request, trả response
- **Service** → Business logic (register, login, token generation)
- **Strategy** → Passport.js strategy, verification logic
- **Guard** → Authorization gate cho các route
- **DTO** → Data Transfer Object, validation tầng input
- **Dependency Injection** → NestJS IoC container quản lý lifecycle

Kiến trúc này là **Layered Architecture** (Controller → Service → Repository via Prisma).

---

## 7. Database Schema liên quan

```sql
-- Bảng users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'CUSTOMER',
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

**Index quan trọng:**
- `email` (UNIQUE) → login lookup O(log n)
- `phone` (UNIQUE) → duplicate check O(log n)

---

## 8. Câu hỏi bảo vệ có thể bị hỏi

### Q1: Tại sao cần 2 token (access + refresh) thay vì 1 token sống lâu?

**A:** Nếu dùng 1 token sống lâu (ví dụ 7 ngày): nếu token bị đánh cắp, attacker có 7 ngày để tấn công. Với 2 token:
- Access token ngắn (15 phút) → bị đánh cắp chỉ có 15 phút để dùng
- Refresh token dài → chỉ dùng ở endpoint `/refresh`, không đi kèm mọi request
- Khi logout → blacklist refresh token → không thể cấp access token mới dù attacker có refresh token

### Q2: JWT có thể bị decode mà không cần secret không?

**A:** Có. JWT payload chỉ được **encode base64**, không encrypt. Bất kỳ ai cũng có thể decode payload (`atob(token.split('.')[1])`). Đây là lý do **không được lưu thông tin nhạy cảm** (password, CCCD, thẻ tín dụng...) trong JWT payload. Secret key chỉ đảm bảo **tính toàn vẹn** (không ai sửa được payload), không đảm bảo **bí mật**.

### Q3: Tại sao không invalidate access token khi logout?

**A:** JWT là stateless — để invalidate access token thì cần lưu state (blacklist). Vì access token sống ngắn (15 phút), rủi ro chấp nhận được. Nếu cần absolute security → blacklist cả access token trong Redis, nhưng sẽ có overhead query Redis cho **mọi** request.

### Q4: Có SQL Injection không?

**A:** Không. Prisma dùng **prepared statements** và **parameterized queries**. Mọi query đều được Prisma escape tự động. Ví dụ:
```typescript
prisma.user.findUnique({ where: { email: dto.email } })
// → SELECT * FROM users WHERE email = $1 (parameterized)
```

### Q5: Tại sao message lỗi login là "Invalid credentials" thay vì "Email không tồn tại"?

**A:** **User enumeration attack** — nếu backend nói "Email không tồn tại", attacker biết email đó không được đăng ký → có thể scan hàng nghìn email để biết ai là user. Với message chung "Invalid credentials", attacker không biết email đúng hay sai.

### Q6: Google login tạo phone là "google-{googleId}" có vấn đề gì?

**A:** Có. Đây là workaround vì schema yêu cầu phone NOT NULL UNIQUE. Vấn đề:
- Phone này không hợp lệ, user không thể dùng để OTP
- Nhìn kỳ lạ trong admin panel

**Giải pháp tốt hơn**: Cho phone nullable với Google user, hoặc sau login Google yêu cầu user bổ sung số điện thoại thật.

### Q7: Nếu JWT_ACCESS_SECRET bị lộ thì sao?

**A:** Attacker có thể tự ký JWT hợp lệ → giả mạo bất kỳ user nào. **Biện pháp**:
- Rotate secret (thay đổi, tất cả token cũ đều invalid)
- Lưu secret trong environment variable, không hardcode
- Dùng asymmetric JWT (RS256) → public key để verify, private key để sign (chỉ lộ public key không sao)

### Q8: Rate limiting có không?

**A:** Hiện tại chưa có rate limiting cho `/login`. Đây là **điểm yếu** — attacker có thể brute-force mật khẩu. Giải pháp: `@nestjs/throttler` để giới hạn số request, hoặc lockout sau N lần sai.

### Q9: Nếu Redis down thì logout có hoạt động không?

**A:** Không. Nếu Redis down, `RedisService.set()` sẽ throw error → logout fail. Nhưng:
- Access token vẫn hết hạn sau 15 phút tự nhiên
- Có thể catch lỗi và vẫn trả về 200 OK (frontend clear localStorage)
- Hiện tại code logout có thể cải thiện thêm error handling cho Redis

### Q10: Cookie vs localStorage để lưu token — chọn cái nào tốt hơn?

**A:** 
- **Cookie** với `HttpOnly; Secure; SameSite=Strict`: An toàn nhất, JavaScript không đọc được → chống XSS
- **localStorage**: Dễ bị XSS đánh cắp

Dự án này dùng localStorage (Zustand persist) → đây là **điểm yếu bảo mật** so với HttpOnly cookie. Tuy nhiên với SPA thì localStorage tiện hơn.

### Q11: Middleware ở Frontend hoạt động thế nào?

**A:** `middleware.ts` của Next.js chạy ở **Edge Runtime** (serverless, không có Node.js APIs). Nó decode JWT thủ công bằng `atob()` (không verify signature vì không có secret ở edge). Điều này đủ để check role và expiry cho UX, nhưng security thật sự vẫn phụ thuộc vào Backend verify JWT.

### Q12: Sự khác biệt giữa `@UseGuards(JwtAuthGuard)` và middleware?

**A:**
- **Middleware (Next.js)**: Chạy ở Edge, kiểm tra nhanh để redirect UX, decode không verify
- **Guard (NestJS)**: Chạy ở Backend, verify signature JWT, query DB kiểm tra user, thật sự bảo vệ API

### Q13: Nếu user thay đổi role (CUSTOMER → ADMIN) thì JWT cũ vẫn có quyền cũ không?

**A:** Có, vì role được encode trong JWT payload. Token cũ vẫn chứa role cũ. Giải pháp: access token ngắn hạn (15 phút) giảm thiểu window. Giải pháp triệt để: check role từ DB mỗi request thay vì từ JWT, nhưng thêm latency.

### Q14: Tại sao dùng `bcrypt.genSalt(10)` thay vì saltRounds=10?

**A:** Về chức năng hoàn toàn giống nhau. `genSalt(10)` tạo salt rồi dùng, còn `bcrypt.hash(password, 10)` sẽ tự genSalt. Cost factor 10 = 2^10 = 1024 vòng hash → đủ chậm để khó brute-force nhưng đủ nhanh để không ảnh hưởng UX (< 100ms).

### Q15: Tại sao mã hóa SHA256 token trước khi lưu Redis blacklist mà không lưu thẳng?

**A:** 
1. **Kích thước**: JWT ~200 chars, SHA256 = 64 chars → tiết kiệm bộ nhớ Redis
2. **Bảo mật**: Nếu Redis bị compromise → attacker không lấy được token gốc từ hash
3. **Performance**: Lookup trong Redis bằng key cố định 64 chars

---

## 9. Điểm yếu và cải thiện

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|-----------|
| Không có rate limiting cho /login | 🔴 Cao | Thêm @nestjs/throttler |
| Lưu token trong localStorage | 🟡 Trung bình | Chuyển sang HttpOnly cookie |
| Google user phone là placeholder | 🟡 Trung bình | Yêu cầu nhập phone sau đăng nhập |
| Không log đăng nhập thất bại | 🟡 Trung bình | Thêm audit log |
| Không có CAPTCHA | 🟡 Trung bình | Google reCAPTCHA v3 |
| JWT_REFRESH_SECRET không rotate định kỳ | 🟡 Trung bình | Key rotation strategy |

---

## 10. Tóm tắt

**File làm gì**: Auth module xử lý đăng ký, đăng nhập (local + Google OAuth), quản lý JWT token pair (access + refresh), và đăng xuất an toàn bằng Redis blacklist.

**5 ý chính:**
1. **Dual token**: Access token 15 phút + Refresh token 7 ngày → cân bằng UX và bảo mật
2. **Redis blacklist**: Refresh token bị vô hiệu hóa khi logout, tự xóa khi hết TTL
3. **Google OAuth flow**: Redirect-based, token truyền qua URL params, tạo user tự động nếu chưa có
4. **JwtStrategy query DB**: Mỗi request đều verify user còn tồn tại trong DB, phát hiện user bị xóa/ban
5. **Không tiết lộ lý do lỗi**: "Invalid credentials" chung → chống user enumeration attack

**Trình bày 2 phút**: "Auth module dùng JWT dual-token pattern. Khi login, tôi cấp access token ngắn hạn 15 phút cho mọi API call, và refresh token dài hạn 7 ngày để làm mới. Khi logout, refresh token được hash SHA256 và lưu vào Redis với TTL bằng thời gian còn lại — token tự hủy khi hết hạn, không tốn bộ nhớ vĩnh viễn. Google OAuth dùng passport-google-oauth20, sau khi nhận profile từ Google thì tìm hoặc tạo user trong DB, rồi cấp JWT như bình thường. Mọi route được bảo vệ bằng JwtAuthGuard — Passport verify signature JWT rồi query DB để chắc chắn user chưa bị xóa."
