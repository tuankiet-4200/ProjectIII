# DÀN Ý SLIDE BẢO VỆ ĐỒ ÁN - 12 PHÚT
**Chủ đề**: Multi-Vendor E-Commerce Platform  
**Trọng tâm**: Các bước thực hiện + Kết quả thu được

---

## ⏱️ Phân bổ thời gian

| Phần | Số slide | Thời gian |
|------|----------|-----------|
| Mở đầu & Giới thiệu | 2 | ~1.5 phút |
| Phân tích & Thiết kế | 2 | ~2 phút |
| Các bước thực hiện | 5 | ~5 phút |
| Kết quả đạt được | 2 | ~2 phút |
| Kết luận | 1 | ~1 phút |
| **Tổng** | **12** | **~12 phút** |

---

## SLIDE 1 — Trang bìa (~30 giây)

**Nội dung:**
- Tên đề tài: **Xây dựng Sàn Thương Mại Điện Tử Đa Nhà Bán**
- Họ tên sinh viên, MSSV
- GVHD
- Trường / Khoa / Năm

**Ghi chú trình bày:**  
Giới thiệu bản thân ngắn gọn, nêu tên đề tài.

---

## SLIDE 2 — Đặt vấn đề & Mục tiêu (~1 phút)

**Tiêu đề:** Bài toán & Mục tiêu đề tài

**Nội dung:**

**Bài toán thực tế:**
- Người bán nhỏ lẻ cần nền tảng bán hàng online hiện đại
- Người mua cần trải nghiệm mua sắm tiện lợi, thông minh
- Quản lý vận chuyển và theo dõi đơn hàng

**Mục tiêu:**
- Xây dựng sàn TMĐT đa nhà bán hoàn chỉnh
- Tích hợp AI hỗ trợ khách hàng tự động
- Triển khai thực tế trên server (production)


---

## SLIDE 3 — Kiến trúc hệ thống (~1 phút)

**Tiêu đề:** Kiến trúc tổng thể

**Nội dung:** *(Sơ đồ kiến trúc — nên dùng hình vẽ)*

```
[Browser / Mobile]
       ↓ HTTPS
   [Nginx] — Reverse Proxy + SSL
    /    \
[Frontend]  [Backend NestJS]
(Next.js)   ├── PostgreSQL
            ├── Redis
            ├── RabbitMQ
            └── AI Service (FastAPI)
```

**Highlight 4 thành phần chính:**
1. **Frontend** — Next.js 15 (Web)
2. **Backend** — NestJS 10 (API + WebSocket + Queue)
3. **AI Service** — FastAPI + DeepSeek LLM
4. **Shipper App** — React Native Expo (Mobile)

**Ghi chú trình bày:**  
"Hệ thống gồm 4 service chạy trên Docker, thông qua Nginx làm reverse proxy, deploy lên VPS với HTTPS."

---

## SLIDE 4 — Thiết kế Database (~1 phút)

**Tiêu đề:** Thiết kế cơ sở dữ liệu

**Nội dung:** *(Sơ đồ ERD rút gọn — chỉ hiển thị các bảng chính)*

**Các bảng chính (12 bảng):**

| Nhóm | Bảng |
|------|------|
| User & Auth | `users`, `user_addresses` |
| Shop & Product | `shops`, `products`, `categories` |
| Order | `parent_orders`, `shop_orders`, `order_items` |
| Logistics | `tracking_events` |
| Feature | `reviews`, `coupons`, `wishlists`, `chat_sessions` |

**2 điểm thiết kế nổi bật:**
- **2-level Order**: ParentOrder → ShopOrder → OrderItem *(mua từ nhiều shop 1 lần)*
- **price_at_purchase**: Snapshot giá tại thời điểm mua *(không bị ảnh hưởng khi shop sửa giá)*

**Ghi chú trình bày:**  
"Điểm quan trọng nhất là thiết kế đơn hàng 2 tầng: khi khách mua sản phẩm của nhiều shop, hệ thống tự chia thành các đơn con cho từng shop xử lý độc lập."

---

## SLIDE 5 — Bước thực hiện 1: Authentication (~1 phút)

**Tiêu đề:** Xác thực & Phân quyền

**Nội dung:**

**Đã triển khai:**
- Đăng ký / Đăng nhập email-password (bcrypt hash)
- Đăng nhập Google OAuth 2.0
- Phân quyền 3 role: `CUSTOMER` / `ADMIN` / `SHIPPER`
- Route protection: Next.js Middleware bảo vệ `/admin`, `/vendor`, `/checkout`

**Luồng đơn giản:**
```
Đăng nhập → JWT access token (15 phút)
         → JWT refresh token (7 ngày)
Logout   → Refresh token bị blacklist trong Redis
```

**Ghi chú trình bày:**  
"Dùng 2 token để cân bằng bảo mật và UX. Access token ngắn hạn → giảm rủi ro nếu bị đánh cắp. Khi logout, refresh token bị vô hiệu hóa trong Redis với TTL tự động."

---

## SLIDE 6 — Bước thực hiện 2: Quản lý Shop & Sản phẩm (~30 giây)

**Tiêu đề:** Hệ thống Vendor — Quản lý Shop & Sản phẩm

**Nội dung:**

**Đã triển khai:**
- Vendor đăng ký shop → Admin duyệt (PENDING → ACTIVE)
- CRUD sản phẩm: tên, giá, tồn kho, hình ảnh, danh mục
- Upload hình ảnh sản phẩm (Multer, lưu local `/uploads`)
- Tìm kiếm & lọc sản phẩm: theo từ khóa, danh mục, shop, sắp xếp giá/bán chạy
- Danh mục dạng cây (category self-referencing)
- Admin quản lý: duyệt shop, ban user, xem analytics

**Ghi chú trình bày:**  
Trình bày nhanh, không đi sâu.

---

## SLIDE 7 — Bước thực hiện 3: Giỏ hàng & Đặt hàng (~1.5 phút)

**Tiêu đề:** Luồng mua hàng — Redis + RabbitMQ

**Nội dung:**

**Kỹ thuật sử dụng:**
- **Redis Hash** cho giỏ hàng: `cart:{userId}` → `{ productId: quantity }`  
  *Lý do: tốc độ O(1), không cần ACID*
- **RabbitMQ** cho xử lý đơn hàng async  
  *Lý do: tránh timeout, xử lý phức tạp không block user*

**Luồng đặt hàng:**
```
User checkout
↓ Tạo đơn PENDING ngay → trả response
↓ Đẩy message vào RabbitMQ
↓ Processor xử lý ngầm (Prisma Transaction):
   - Áp dụng coupon
   - Trừ tồn kho (Optimistic Lock)
   - Tạo ShopOrder cho từng shop
↓ Thông báo kết quả qua WebSocket
```

**Chống oversell bằng Optimistic Locking:**
```sql
UPDATE products SET stock = stock - N
WHERE id = X AND stock >= N   ← Atomic check
```

**Thanh toán:** COD hoặc SePay (cổng thanh toán VN)

**Ghi chú trình bày:**  
"Đây là phần kỹ thuật phức tạp nhất. Optimistic locking đảm bảo dù 100 user cùng mua sản phẩm cuối cùng, chỉ 1 người thành công — không cần lock bảng."

---

## SLIDE 8 — Bước thực hiện 4: Realtime & Tracking (~1 phút)

**Tiêu đề:** Thông báo Realtime & Theo dõi vận chuyển

**Nội dung:**

**Công nghệ:** Socket.IO (WebSocket + polling fallback)

**3 loại sự kiện realtime:**

| Sự kiện | Trigger | Người nhận |
|---------|---------|------------|
| `order_checkout_success/failed` | RabbitMQ xử lý xong | Khách hàng |
| `orderStatusChanged` | Shop cập nhật trạng thái | Khách hàng |
| `trackingEvent` | Shipper ghi nhận sự kiện | Khách hàng |

**Cơ chế Room của Socket.IO:**
```
Mỗi user join room "user_{id}" khi kết nối
→ Server emit đến đúng room → chỉ user đó nhận
```

**Shipper App (React Native):**
- Xem danh sách đơn hàng cần giao
- Cập nhật trạng thái: `picked_up` → `delivering` → `delivered`
- Upload ảnh bằng chứng giao hàng
- Tự động cập nhật trạng thái ShopOrder

**Ghi chú trình bày:**  
"Khi shipper bấm 'Đã giao hàng' trên app, khách hàng nhận thông báo realtime ngay lập tức mà không cần F5."

---

## SLIDE 9 — Bước thực hiện 5: AI Chatbot (~1 phút)

**Tiêu đề:** AI Chatbot — Keyword Context Injection + DeepSeek LLM

**Nội dung:**

**Kỹ thuật:** Keyword-based SQL Search + Prompt Injection *(không phải RAG đầy đủ)*

**Luồng hoạt động:**
```
User hỏi: "Shop có áo thun không?"
↓
1. Trích xuất từ khóa: ["áo", "thun"] (lọc stop words tiếng Việt)
↓
2. Query SQL: tìm sản phẩm shop match keywords
↓
3. Nhúng vào system prompt:
   "Sản phẩm liên quan: [Áo thun cotton, 150,000đ, còn 20]
    Không bịa đặt giá, tồn kho..."
↓
4. Gọi DeepSeek API → AI trả lời chính xác theo dữ liệu thực
```

**Tính năng:**
- ✅ AI trả lời tự động (shop bật `ai_auto_respond`)
- ✅ Shop owner có thể tự trả lời (override AI)
- ✅ Lịch sử hội thoại 10 tin nhắn gần nhất
- ✅ AI chạy async — không block response người dùng

**Gợi ý sản phẩm:**
- Dựa trên hành vi: VIEW (1đ) / ADD_TO_CART (5đ) / PURCHASE (8đ)
- Kết hợp recency decay → gợi ý sản phẩm cùng category/shop yêu thích

**Ghi chú trình bày:**  
"Điểm quan trọng: AI không bịa đặt thông tin vì chỉ được phép nói về sản phẩm có trong danh sách inject vào prompt."

---

## SLIDE 10 — Demo / Giao diện hệ thống (~1.5 phút)

**Tiêu đề:** Demo — Giao diện hệ thống

**Nội dung:** *(Chèn screenshots thực tế)*

**Bố cục gợi ý — 4 ảnh chụp màn hình:**

| Vị trí | Nội dung |
|--------|----------|
| Trên trái | Trang chủ / danh sách sản phẩm |
| Trên phải | Trang chi tiết sản phẩm + Chat |
| Dưới trái | Dashboard Vendor (quản lý đơn hàng) |
| Dưới phải | Shipper App (danh sách đơn cần giao) |

*Hoặc có thể dùng 2 slide: 1 slide web, 1 slide mobile app*

**Ghi chú trình bày:**  
Chỉ ra các tính năng nổi bật trên màn hình. Nếu có thể demo live — càng tốt.

---

## SLIDE 11 — Kết quả đạt được (~1 phút)

**Tiêu đề:** Kết quả đạt được

**Nội dung:**

**Chức năng đã hoàn thành:**

| Module | Tính năng |
|--------|-----------|
| Auth | Đăng ký, đăng nhập, Google OAuth, JWT, phân quyền 3 role |
| Shop | Đăng ký shop, duyệt shop, quản lý sản phẩm, upload ảnh |
| Mua hàng | Giỏ hàng, đặt hàng, coupon, thanh toán COD + SePay |
| Vận chuyển | Tracking realtime, Shipper App mobile |
| AI | Chatbot tư vấn tự động, Gợi ý sản phẩm cá nhân hóa |
| Admin | Dashboard analytics, quản lý user/shop |
| Realtime | WebSocket: thông báo đơn hàng, tracking, chat |

**Triển khai thực tế:**
- 🌐 Domain: `https://demoserver.io.vn`
- 🔒 HTTPS với Let's Encrypt
- 🐳 Docker Compose: 6 services (Nginx, Backend, Frontend, AI, PostgreSQL, Redis, RabbitMQ)

**Ghi chú trình bày:**  
"Hệ thống đã được deploy thực tế, có thể truy cập tại domain..."

---

## SLIDE 12 — Kết luận & Hướng phát triển (~30 giây)

**Tiêu đề:** Kết luận & Hướng phát triển

**Nội dung:**

**Kết luận:**
- Hoàn thành đầy đủ mục tiêu đề ra
- Áp dụng được các kỹ thuật: async queue, WebSocket, Docker
- Deploy thực tế với HTTPS, sẵn sàng cho demo

**Điểm kỹ thuật nổi bật:**
1. Async order flow (RabbitMQ) — không timeout, không mất đơn
2. Optimistic locking — chống oversell mà không lock bảng
3. Socket.IO realtime — thông báo tức thời 3 chiều (user/shop/shipper)
4. AI Chatbot context-aware — trả lời đúng dữ liệu thực, không hallucinate

**Hướng phát triển:**
- 🔲 Nâng cấp AI lên RAG thực sự (vector embedding + pgvector)
- 🔲 Thêm rate limiting & CAPTCHA chống brute-force
- 🔲 CI/CD pipeline tự động
- 🔲 Tích hợp thêm cổng thanh toán (VNPay, MoMo)

---

## 📌 Tips trình bày

### Cấu trúc mỗi slide nên có:
- **1 tiêu đề rõ ràng** — ngắn, súc tích
- **Tối đa 5 bullet points** — không chép nguyên văn lên slide
- **1 sơ đồ/hình minh họa** — mỗi slide kỹ thuật nên có

### Những điều KHÔNG nên:
- ❌ Đọc nguyên văn từ slide
- ❌ Slide quá nhiều chữ (> 6 dòng)
- ❌ Nói "hệ thống dùng RAG" nếu không hiểu rõ (đã phân tích: hệ thống dùng Keyword SQL Search)

### Chuẩn bị cho Q&A (sau 12 phút):
- Tại sao dùng RabbitMQ? → Async processing, không block user
- Race condition khi đặt hàng? → Optimistic locking trong `updateMany`
- Hệ thống AI hoạt động thế nào? → Keyword extraction + SQL + Prompt injection (không phải RAG đầy đủ)
- JWT hết hạn thì sao? → Refresh token (7 ngày) tự động cấp access token mới
