# TỔNG HỢP CÂU HỎI BẢO VỆ - 50+ Câu hỏi & Đáp án

---

## NHÓM 1: Kiến trúc tổng thể

**Q: Hệ thống này thuộc loại kiến trúc gì?**  
A: Kiến trúc Monolith có tích hợp nhẹ Microservice. Backend NestJS xử lý hầu hết (HTTP + WebSocket + RabbitMQ consumer). AI Service tách thành service riêng bằng Python FastAPI, giao tiếp qua HTTP. Phù hợp cho giai đoạn MVP — dễ deploy, debug hơn full microservice.

**Q: Tại sao tách AI Service thành service riêng thay vì viết trong NestJS?**  
A: Python có ecosystem AI/ML tốt hơn (libraries, LLM SDKs). FastAPI là framework async hiệu năng cao phù hợp AI workload. Tách ra còn cho phép scale AI service độc lập khi cần.

**Q: Hệ thống scale như thế nào khi traffic tăng?**  
A: Hiện tại scale vertical (tăng RAM/CPU server). Scale horizontal: chạy nhiều instance Backend → cần sticky sessions cho Socket.IO (dùng Redis adapter), RabbitMQ đã hỗ trợ multiple consumers. Database scale bằng read replicas.

---

## NHÓM 2: Authentication & Security

**Q: JWT là gì? Cấu trúc?**  
A: JSON Web Token gồm 3 phần: Header (algorithm) . Payload (data) . Signature — base64url encoded, ngăn cách bởi dấu chấm. Signature = HMAC(header + payload, secret). Verify bằng cách ký lại và so sánh.

**Q: Khác nhau giữa Authentication và Authorization?**  
A: Authentication = Xác thực danh tính (Bạn là ai? — JWT verify). Authorization = Phân quyền (Bạn được làm gì? — role check: ADMIN/CUSTOMER/SHIPPER).

**Q: HTTPS có nghĩa gì và tại sao cần?**  
A: HTTPS = HTTP + TLS encryption. Mã hóa dữ liệu giữa client và server → không ai có thể đọc trộm JWT trong transit. Certbot + Let's Encrypt cung cấp certificate miễn phí.

**Q: Tấn công CSRF là gì? Dự án có bị không?**  
A: CSRF = Cross-Site Request Forgery — trang web độc hại giả gửi request tên người dùng. Dự án dùng JWT trong Authorization header (không phải cookie-based auth) → CSRF không hiệu quả vì trang độc hại không đọc được header từ domain khác. Tuy nhiên, access_token lưu cả trong cookie (cho middleware) nên cần SameSite=Strict.

**Q: SQL Injection?**  
A: Không thể xảy ra vì Prisma dùng parameterized queries. Input luôn là tham số, không bao giờ nối chuỗi vào SQL.

**Q: XSS (Cross-Site Scripting)?**  
A: Nguy cơ thấp với React/Next.js vì auto-escape HTML. Rủi ro chính là token trong localStorage bị đọc qua XSS. Giảm thiểu bằng Content Security Policy header.

---

## NHÓM 3: Database

**Q: Tại sao chọn PostgreSQL thay vì MySQL hay MongoDB?**  
A: PostgreSQL mạnh về: JSON fields (specifications), Array fields (images[], features[]), UUID native type, full ACID compliance, self-referencing relations (Category tree). MongoDB không phù hợp vì dữ liệu có nhiều quan hệ phức tạp.

**Q: ORM là gì? Tại sao dùng Prisma?**  
A: ORM (Object-Relational Mapping) = layer trừu tượng hóa database. Prisma: type-safe (TypeScript types tự generate), migration management, readable query API, hỗ trợ tốt NestJS.

**Q: Database Transaction là gì? Khi nào dùng?**  
A: Transaction = nhóm nhiều thao tác DB thành 1 đơn vị: hoặc tất cả thành công, hoặc tất cả rollback. Dùng trong `orders.processor.ts`: coupon update + shopOrder create + orderItem create + stock decrement — nếu 1 bước fail (hết hàng) → rollback toàn bộ, không tạo đơn dở dang.

**Q: ACID là gì?**  
A: Atomicity (tất cả hoặc không), Consistency (data luôn valid), Isolation (transaction song song không ảnh hưởng nhau), Durability (đã commit là lưu vĩnh viễn dù crash).

**Q: N+1 Query Problem là gì? Dự án có không?**  
A: N+1 = 1 query lấy N records, rồi N query để lấy related data. Prisma `include` dùng JOIN thay vì N+1. Tuy nhiên trong `getCart()`, lấy productIds từ Redis rồi query products → đây là batch query (1 query), không phải N+1.

**Q: Index là gì? Khi nào cần?**  
A: Index = cấu trúc dữ liệu phụ để tăng tốc lookup. B-tree index cho equality/range queries. Prisma tự tạo index cho `@id`, `@unique`, FK fields. Nên thêm index cho các field thường WHERE: `shop_id` trong product, `user_id` trong order.

---

## NHÓM 4: Redis

**Q: Redis là gì? Khác gì PostgreSQL?**  
A: Redis = in-memory key-value store, tốc độ O(1) cho get/set. PostgreSQL = disk-based relational DB, tốc độ chậm hơn nhưng ACID, relations. Redis dùng cho: giỏ hàng (tốc độ cao), token blacklist (TTL tự xóa), session cache.

**Q: Redis Hash là gì? Tại sao dùng cho cart?**  
A: Hash = key → { field: value }. `cart:{userId}` = `{ "productId": "quantity" }`. Cho phép HGET/HSET từng field (từng product) mà không cần deserialize toàn bộ cart. O(1) cho mỗi thao tác.

**Q: TTL (Time-To-Live) trong Redis?**  
A: TTL = thời gian sống của key, Redis tự xóa khi hết. Dùng cho refresh token blacklist: `SET key value EX {ttl_seconds}` → key tự xóa khi token hết hạn → không tốn bộ nhớ vĩnh viễn.

---

## NHÓM 5: RabbitMQ & Async

**Q: Message Queue là gì? Tại sao cần?**  
A: Queue = hàng đợi tin nhắn. Producer đẩy message vào queue, consumer xử lý sau. Lợi ích: decoupling, không block user, retry khi fail, xử lý đỉnh tải (spike) mà không crash service.

**Q: Tại sao checkout dùng async queue thay vì sync?**  
A: Xử lý đơn hàng gồm: verify stock N sản phẩm, create transaction, call SePay API — có thể mất 2-10 giây. Sync → user phải chờ 10 giây → UX tệ. Async → response ngay ("đang xử lý"), kết quả đến qua WebSocket.

**Q: Nếu message xử lý fail thì sao?**  
A: Catch block trong `handleOrderCreate` xóa parentOrder và emit `order_checkout_failed` qua WebSocket. Message bị consume xong (ACK). Cần thêm: Dead Letter Queue để lưu failed messages cho debug/retry.

**Q: Idempotency trong message queue?**  
A: Nếu message được deliver 2 lần (do network), processor chạy 2 lần → tạo 2 đơn hàng. Cần idempotency key để detect và bỏ qua message đã xử lý. Hiện dự án chưa implement — điểm cần cải thiện.

---

## NHÓM 6: WebSocket / Realtime

**Q: WebSocket vs HTTP khác nhau thế nào?**  
A: HTTP = request-response, client phải hỏi trước server mới trả lời. WebSocket = full-duplex, persistent connection, server push chủ động đến client bất kỳ lúc nào. Phù hợp cho realtime: chat, notifications, live updates.

**Q: Socket.IO polling fallback là gì?**  
A: Nếu WebSocket bị block (corporate firewall, old proxy), Socket.IO fallback sang HTTP Long Polling: client gửi request, server giữ connection mở đến khi có data. Kém hiệu quả hơn WS nhưng vẫn "realtime".

**Q: Làm sao đảm bảo message WebSocket đến đúng người?**  
A: Dùng Room: mỗi user join `room "user_{id}"` khi connect. Server `emit("event", data, to("user_123"))` → chỉ socket trong room đó nhận. Không expose socket IDs, không broadcast toàn bộ.

---

## NHÓM 7: AI & Recommendation

**Q: RAG là gì? Tại sao cần cho chatbot?**  
A: RAG = Retrieval-Augmented Generation. LLM thuần không biết data của shop → hallucinate. RAG: query DB lấy sản phẩm thực → inject vào system prompt → LLM trả lời dựa trên data thực. Kết quả: giá/tồn kho chính xác.

**Q: DeepSeek vs GPT-4?**  
A: DeepSeek rẻ hơn nhiều (~10-30x), chất lượng tiếng Việt tốt, API tương thích OpenAI format (dễ swap). GPT-4 mạnh hơn nhưng chi phí cao cho project đồ án.

**Q: Recommendation engine dùng ML không?**  
A: Không. Dùng heuristic scoring: tính điểm category/shop dựa trên interaction_type weight × recency weight → sort → lấy top 16. Đơn giản nhưng hiệu quả cho MVP. Upgrade: Matrix Factorization, Neural Collaborative Filtering.

**Q: Cold start problem trong recommendation?**  
A: User mới chưa có interaction → không có data để recommend. Giải pháp: fallback sang trending products (sort by sales_count). Khi user bắt đầu interact → dần dần personalize.

---

## NHÓM 8: DevOps & Deployment

**Q: Docker là gì? Tại sao dùng?**  
A: Container hóa — đóng gói app + dependencies thành image. Chạy giống nhau ở mọi môi trường (local, staging, production). Không còn "chạy được trên máy tôi mà không chạy được trên server".

**Q: `docker compose down` vs `down -v` khác gì?**  
A: `down` dừng + xóa containers nhưng giữ volumes (data PostgreSQL). `down -v` xóa cả volumes → mất toàn bộ dữ liệu database. Tuyệt đối không dùng `-v` trong production.

**Q: Tại sao port 5432 (PostgreSQL) bị ẩn trong production?**  
A: Nếu lộ ra ngoài → attacker scan port → brute-force credentials → compromised database. Dùng `127.0.0.1:5432:5432` → chỉ localhost của VPS truy cập được. Kết nối từ xa dùng SSH tunnel.

**Q: CI/CD là gì? Dự án có không?**  
A: CI/CD = Continuous Integration/Continuous Deployment. Hiện dự án deploy thủ công (build Docker image, push lên server, restart). Production app cần: GitHub Actions → test → build image → push registry → deploy tự động.

---

## NHÓM 9: Điểm yếu & Cải thiện

**Q: Điểm yếu lớn nhất của hệ thống?**  
A: 
1. Không có rate limiting → dễ brute-force
2. Token lưu localStorage → XSS vulnerability  
3. RabbitMQ message không idempotent → có thể xử lý 2 lần
4. Coupon race condition (usage_limit không được enforce atomic)
5. AI response không có fallback message rõ ràng

**Q: Nếu phải làm lại, bạn thay đổi gì?**  
A: Thêm rate limiting (nestjs/throttler), dùng HttpOnly cookie cho token, thêm idempotency key cho RabbitMQ messages, implement coupon atomic update, thêm tầng caching (Redis) cho product listing API.

**Q: Monitoring và Observability?**  
A: Hiện chỉ có `Logger` của NestJS ra console. Production cần: structured logging (Winston), distributed tracing (Jaeger), metrics (Prometheus + Grafana), alerting (PagerDuty).

---

## Câu hỏi "Hiểu sâu"

**Q: Race condition là gì? Ví dụ trong dự án?**  
A: Race condition = 2 thread/process đọc-sửa dữ liệu chia sẻ đồng thời → kết quả không xác định. Ví dụ: 2 user cùng mua sản phẩm cuối cùng → cả 2 đọc `stock=1` → cả 2 đặt hàng → `stock=-1`. Giải quyết: optimistic locking với `updateMany({ where: { stock >= quantity } })`.

**Q: Prisma transaction vs database transaction?**  
A: Prisma `$transaction([...])` = array of Prisma calls chạy trong 1 DB transaction. `$transaction(async (tx) => {...})` = interactive transaction cho phép conditionals. Cả 2 đều map xuống `BEGIN ... COMMIT/ROLLBACK` của PostgreSQL.

**Q: Tại sao `Promise.all` trong generateTokens?**  
A: Sign JWT access token và refresh token là 2 operations độc lập. `Promise.all` chạy song song → tổng thời gian = max(t1, t2) thay vì t1+t2. Trong môi trường async Node.js, parallel I/O quan trọng cho performance.

**Q: `@EventPattern` vs `@MessagePattern` trong NestJS?**  
A: `@EventPattern` = fire-and-forget (emit, không cần reply). `@MessagePattern` = request-reply (send, đợi response). Orders dùng `emit` → `@EventPattern` vì không cần response từ queue.
