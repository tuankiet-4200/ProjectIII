# CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI

---

## 1.1 Bối cảnh và động lực nghiên cứu

Trong những năm gần đây, thương mại điện tử (TMĐT) tại Việt Nam đã có sự tăng trưởng vượt bậc. Theo báo cáo của Hiệp hội Thương mại điện tử Việt Nam (VECOM), doanh thu TMĐT Việt Nam năm 2023 đạt khoảng 20,5 tỷ USD và dự kiến tiếp tục tăng trưởng mạnh trong các năm tiếp theo. Sự phổ biến của smartphone và internet băng thông rộng đã thúc đẩy hành vi mua sắm trực tuyến trở thành thói quen của người tiêu dùng Việt Nam, đặc biệt ở thế hệ trẻ từ 18–35 tuổi.

Tuy nhiên, phần lớn thị trường TMĐT hiện nay bị chiếm lĩnh bởi các nền tảng lớn như Shopee, Lazada, Tiki — những nền tảng đòi hỏi chi phí vận hành cao và áp đặt nhiều điều kiện cho nhà bán lẻ nhỏ. Điều này tạo ra khoảng cách lớn cho những người bán nhỏ lẻ muốn tham gia thị trường nhưng thiếu nguồn lực để xây dựng hệ thống riêng.

Bên cạnh đó, sự bùng nổ của trí tuệ nhân tạo (AI), đặc biệt là các mô hình ngôn ngữ lớn (Large Language Models - LLM), mở ra cơ hội tích hợp AI vào các hệ thống TMĐT để nâng cao trải nghiệm người dùng — từ chatbot tư vấn tự động đến hệ thống gợi ý sản phẩm cá nhân hóa.

Từ bối cảnh đó, nhóm đề tài xác định nhu cầu xây dựng một **nền tảng thương mại điện tử đa nhà bán (Multi-Vendor E-Commerce Platform)** — một hệ thống hoàn chỉnh cho phép nhiều nhà bán cùng kinh doanh trên một nền tảng duy nhất, tích hợp AI và có khả năng vận hành thực tế trên môi trường production.

---

## 1.2 Mục tiêu đề tài

Đề tài đặt ra các mục tiêu cụ thể sau:

**Mục tiêu chức năng:**
- Xây dựng hệ thống TMĐT đa nhà bán với đầy đủ luồng: đăng ký tài khoản → tạo shop → đăng sản phẩm → khách hàng mua → shipper giao → đánh giá.
- Tích hợp chatbot AI tự động tư vấn sản phẩm theo ngữ cảnh từng shop.
- Xây dựng hệ thống gợi ý sản phẩm dựa trên hành vi người dùng.
- Xây dựng ứng dụng di động cho shipper theo dõi và cập nhật trạng thái giao hàng.
- Triển khai hệ thống thực tế trên VPS với HTTPS và tên miền.

**Mục tiêu kỹ thuật:**
- Áp dụng kiến trúc phân tầng rõ ràng (Controller - Service - Repository via ORM).
- Xử lý bất đồng bộ qua Message Queue (RabbitMQ) cho luồng đặt hàng.
- Realtime notification qua WebSocket (Socket.IO).
- Đảm bảo bảo mật: JWT dual-token, bcrypt, Redis blacklist, HTTPS.
- Container hóa toàn bộ hệ thống bằng Docker.

---

## 1.3 Phạm vi đề tài

**Trong phạm vi:**
- Hệ thống web dành cho khách hàng và nhà bán (Next.js)
- Backend API và xử lý nghiệp vụ (NestJS)
- AI Service tư vấn chatbot (FastAPI + DeepSeek)
- Ứng dụng mobile cho shipper (React Native Expo)
- Tích hợp thanh toán SePay (cổng thanh toán Việt Nam)
- Triển khai trên VPS với Docker, Nginx, Let's Encrypt

**Ngoài phạm vi:**
- Ứng dụng mobile cho khách hàng (chỉ hỗ trợ web)
- Tích hợp đơn vị vận chuyển bên thứ 3 (GHTK, GHN)
- Hệ thống quảng cáo và marketing nâng cao
- Xử lý hoàn tiền tự động

---

## 1.4 Đối tượng sử dụng hệ thống

Hệ thống phục vụ 4 nhóm người dùng chính:

| Vai trò | Mô tả | Chức năng chính |
|---------|-------|-----------------|
| **Khách hàng** | Người mua sắm trực tuyến | Duyệt sản phẩm, đặt hàng, theo dõi đơn, chat, đánh giá |
| **Vendor (Nhà bán)** | Chủ shop trên sàn | Đăng ký shop, quản lý sản phẩm, xử lý đơn hàng, chat với khách |
| **Shipper** | Nhân viên giao hàng | Xem đơn cần giao, cập nhật trạng thái, upload ảnh giao hàng |
| **Admin** | Quản trị viên sàn | Duyệt shop, quản lý user, xem báo cáo doanh thu |

---

## 1.5 Phương pháp thực hiện

Đề tài được thực hiện theo phương pháp **Agile-inspired iterative development**:

1. **Nghiên cứu & Phân tích** (Tuần 1–2): Khảo sát các sàn TMĐT hiện có, xác định yêu cầu chức năng, lựa chọn công nghệ.

2. **Thiết kế hệ thống** (Tuần 3–4): Thiết kế database schema, API endpoints, kiến trúc tổng thể.

3. **Cài đặt Backend** (Tuần 5–8): Xây dựng NestJS API, tích hợp Prisma ORM, Redis, RabbitMQ.

4. **Cài đặt Frontend** (Tuần 7–10): Xây dựng Next.js web app, Zustand state management, Socket.IO client.

5. **Cài đặt AI Service & Mobile** (Tuần 9–11): FastAPI chatbot, React Native shipper app.

6. **Tích hợp & Kiểm thử** (Tuần 11–12): Integration testing, bug fixing.

7. **Triển khai Production** (Tuần 13): Docker, Nginx, HTTPS, domain setup.

---

## 1.6 Cấu trúc báo cáo

Báo cáo được tổ chức thành 5 chương:

- **Chương 1**: Giới thiệu đề tài, bối cảnh, mục tiêu, phạm vi
- **Chương 2**: Cơ sở lý thuyết — các công nghệ và kỹ thuật được áp dụng
- **Chương 3**: Phân tích và thiết kế hệ thống
- **Chương 4**: Cài đặt và triển khai
- **Chương 5**: Kết quả đạt được, đánh giá và hướng phát triển
