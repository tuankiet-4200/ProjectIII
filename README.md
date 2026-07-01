# PRODUCTION DEPLOYMENT GUIDE - PROJECT III

## Thông tin hệ thống

- IP Server: `103.82.24.142`
- Domain: `demoserver.io.vn`
- Thư mục dự án: `~/kietnt/ProjectIII`

## Phần I: Triển khai ban đầu (Cách 1 - Chạy port lẻ)

Đây là cấu hình thô ban đầu khi chưa cài đặt tên miền và SSL. Các service được mở trực tiếp ra ngoài Internet qua các cổng lẻ của VPS.

### 1. Cấu hình file `.env` ban đầu (chạy IP + port)

```env
BACKEND_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/projectiii?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
AI_SERVICE_URL=http://ai-service:8000
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Sử dụng IP và Port công khai của VPS
FRONTEND_URL=http://103.82.24.142:3001
NEXT_PUBLIC_API_URL=http://103.82.24.142:3005/api
GOOGLE_CALLBACK_URL=http://103.82.24.142/api/auth/google/callback
```

### 2. Mở cổng công khai trong `docker-compose.prod.yml`

Trong giai đoạn này, các cổng được ánh xạ trực tiếp ra ngoài để máy local có thể gọi tới:

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432" # Lộ cổng DB ra ngoài (nguy cơ bảo mật)

  backend:
    image: projectiii-backend
    ports:
      - "3005:3000" # Mở cổng API công khai

  frontend:
    image: projectiii-frontend
    ports:
      - "3001:3000" # Mở cổng web công khai
```

### 3. Nhược điểm của Cách 1

- Trình duyệt sẽ cảnh báo "Không an toàn" do không có HTTPS.
- Không thể sử dụng một số tính năng bảo mật cao hoặc chạy production thực tế.
- Lộ cổng Database (`5432`) ra ngoài Internet rất dễ bị scan và tấn công brute-force.

## Phần II: Chuyển đổi sang production chuẩn (Cách 2 - Nginx + HTTPS)

Đây là cấu hình tối ưu, ẩn toàn bộ cổng lẻ vào nội bộ Server, chỉ đi ra ngoài duy nhất qua cổng mã hóa an toàn của Nginx (`80/443`).

### 1. Cấu hình trang quản lý tên miền (DNS)

Trên giao diện quản lý tên miền (ví dụ: TenTen), cấu hình các bản ghi:

- Bản ghi `@`: Loại `A` -> Giá trị: `103.82.24.142`
- Bản ghi `www`: Loại `A` -> Giá trị: `103.82.24.142`

### 2. Cập nhật file `.env` sang domain + HTTPS

Mở file `.env` tại thư mục gốc dự án và chuyển sang giao diện không kèm cổng:

```env
FRONTEND_URL=https://demoserver.io.vn
NEXT_PUBLIC_API_URL=https://demoserver.io.vn/api
GOOGLE_CALLBACK_URL=https://demoserver.io.vn/api/auth/google/callback
```

### 3. Đóng bảo mật các ports trong `docker-compose.prod.yml`

Thêm `127.0.0.1:` phía trước phần ports để ép các container chỉ lắng nghe nội bộ, chặn hoàn toàn truy cập từ Internet:

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "127.0.0.1:5432:5432"

  backend:
    image: projectiii-backend
    ports:
      - "127.0.0.1:3005:3000"

  frontend:
    image: projectiii-frontend
    ports:
      - "127.0.0.1:3001:3000"
```

### 4. Thiết lập Nginx reverse proxy

Cài đặt Nginx và cấu hình file `/etc/nginx/sites-available/projectiii`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name demoserver.io.vn www.demoserver.io.vn;

    client_max_body_size 50M;

    # Route sang NestJS Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3005/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cấu hình WebSocket cho Chat
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3005/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Route sang Next.js Frontend
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Kích hoạt và nạp lại cấu hình:

```bash
sudo ln -s /etc/nginx/sites-available/projectiii /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Kích hoạt SSL (HTTPS) với Certbot

Chạy lệnh xin cấp chứng chỉ và cấu hình tự động:

```bash
sudo certbot --nginx -d demoserver.io.vn -d www.demoserver.io.vn
```

Tối ưu hóa khối cổng 80 cũ bằng cách thay thế redirect cấu trúc `if` cũ của certbot bằng khối chuyển hướng vô điều kiện để tránh lỗi `ERR_SSL_PROTOCOL_ERROR`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name demoserver.io.vn www.demoserver.io.vn;
    return 301 https://$host$request_uri;
}
```

Cập nhật lại Nginx:

```bash
sudo nginx -t && sudo systemctl restart nginx
```

## Phần III: Vận hành, bật/tắt và quản trị dự án

Mọi thao tác quản lý Docker bắt buộc phải thực hiện tại thư mục chứa file cấu hình:

```bash
cd ~/kietnt/ProjectIII
```

### 1. Khi muốn dừng dự án

Cách 1: Hạ hoàn toàn các container, khuyên dùng khi bảo trì hoặc giải phóng tài nguyên.

```bash
docker compose -f docker-compose.prod.yml down
```

Lưu ý: tuyệt đối không thêm đuôi `-v` (ví dụ: `down -v`). Tham số `-v` sẽ xóa sạch toàn bộ volume dữ liệu của Postgres, làm mất dữ liệu thực tế.

Cách 2: Chỉ đóng băng tạm thời.

```bash
docker compose -f docker-compose.prod.yml stop
```

### 2. Khi muốn bật dự án

Nếu trước đó đã dùng lệnh `down` hoặc bật lần đầu:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Không cần thêm `--build` nếu code không thay đổi, hệ thống sẽ bật lên ngay lập tức.

Nếu trước đó chỉ dùng lệnh `stop`:

```bash
docker compose -f docker-compose.prod.yml start
```

### 3. Khi muốn khởi động lại nhanh

Khi cần restart nhanh toàn bộ hệ thống để nhận cấu hình mới hoặc clear bộ nhớ:

```bash
docker compose -f docker-compose.prod.yml restart
```

### 4. Kiểm tra trạng thái hệ thống

Để kiểm tra xem các service đã lên trạng thái `Up` an toàn hay chưa:

```bash
docker compose -f docker-compose.prod.yml ps
```

### 5. Cập nhật DB migration và đổ lại seed data

Nếu lỡ làm mất data:

```bash
# Thực thi migration cấu trúc bảng
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Nạp lại dữ liệu mẫu vào database
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## Phần IV: Cấu hình liên kết ngoại vi

### 1. Đồng bộ Google OAuth 2.0 (Google Cloud Console)

Truy cập phần quản lý ứng dụng, cấu hình lại các đường link khớp với domain HTTPS mới:

- Authorized JavaScript origins: `https://demoserver.io.vn` (không có dấu gạch chéo `/` ở cuối)
- Authorized redirect URIs: `https://demoserver.io.vn/api/auth/google/callback`

### 2. Kết nối Database an toàn bằng TablePlus (SSH Tunnel)

Vì cổng `5432` đã bị chặn ngoài Internet, cấu hình TablePlus thông qua giao thức SSH Tunnel:

Nửa trên (Database):

- Host: `127.0.0.1` (kết nối nội bộ bên trong VPS)
- Port: `5432`
- User/Password/Database: lấy thông tin từ file `.env`

Nửa dưới (SSH Tunnel - bật công tắc SSH):

- SSH Host: `103.82.24.142` (IP của VPS)
- SSH User: `root`
- SSH Auth: nhập mật khẩu VPS root hoặc trỏ tới file Private Key