# ProjectIII Deployment Guide

Tai lieu nay huong dan deploy ProjectIII tu GitHub len server. Du an gom:

- `frontend`: Next.js
- `backend`: NestJS + Prisma
- `ai-service`: FastAPI + DeepSeek
- `postgres`, `redis`, `rabbitmq`: ha tang phu tro

Co 2 cach deploy:

- **Cach A - Demo/Staging nhanh:** dung `docker-compose.yml` hien tai. De chay demo tren server, nhanh va de debug.
- **Cach B - Production/direct-port khuyen nghi:** dung `docker-compose.prod.yml`, bo dev mode, bo bind mount, chay image build san. Cach nay van co the test truc tiep bang port `3001`, `3000`, `8000`.

Neu server chi co 4GB RAM, nen dung Cach B ngay ca khi moi test bang port truc tiep. Cach A chay watcher/dev server nen ton RAM hon.

---

## 1. Co can tao nhanh deploy rieng khong?

Khong can tao code khac cho deploy. Nen dung cung source code, chi khac:

- `.env`
- domain
- secrets
- reverse proxy
- docker compose override
- database volume

Khuyen nghi ve nhanh:

- `develop`: code dang phat trien
- `production` hoac `main`: code on dinh de deploy
- `deploy/*`: nhanh thu nghiem deploy tam thoi neu can

Tao nhanh `production` tu `develop`:

```bash
git checkout develop
git pull
git checkout -b production
git push -u origin production
```

Khi `develop` da on va muon dua len deploy:

```bash
git checkout production
git pull
git merge develop
git push
```

Tren server, nen checkout nhanh deploy:

```bash
git checkout production
```

---

## 2. Chuan bi server

Vi du server Ubuntu 22.04/24.04.

Yeu cau toi thieu:

- 2 CPU
- 4GB RAM tro len
- 20GB disk tro len
- Docker Engine
- Docker Compose V2
- Git
- Domain neu public production

Cap nhat server:

```bash
sudo apt update
sudo apt upgrade -y
```

Cai Git:

```bash
sudo apt install -y git curl ca-certificates
```

Cai Docker neu server chua co:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Dang xuat/dang nhap lai SSH, sau do kiem tra:

```bash
docker --version
docker compose version
```

Neu lenh `docker` bi permission denied, co the chay tam bang `sudo docker`, hoac logout/login lai de group `docker` co hieu luc.

---

## 3. Cau hinh firewall

Neu deploy demo truc tiep bang port:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3001/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

Neu deploy production qua Nginx/Caddy HTTPS, chi nen mo:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Khong nen public cac cong nay ra internet trong production:

- Postgres `5432`
- Redis `6379`
- RabbitMQ `5672`
- RabbitMQ Management `15672`
- AI service `8000`

---

## 4. Clone source tren server

```bash
git clone <REPO_URL>
cd ProjectIII
git checkout production
```

Neu chua co nhanh `production`, co the dung:

```bash
git checkout develop
```

Kiem tra source:

```bash
git status
ls
```

---

## 5. Tao file moi truong

Tao `.env` o root:

```bash
cp .env.example .env
```

Tao `.env` cho AI service:

```bash
cp ai-service/.env.example ai-service/.env
```

Mo file de sua:

```bash
nano .env
nano ai-service/.env
```

### 5.1 Root `.env` mau cho demo/local server

Dung khi chua co domain, truy cap bang IP server.

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_postgres_password
POSTGRES_DB=projectiii

RABBITMQ_DEFAULT_USER=projectiii
RABBITMQ_DEFAULT_PASS=change_this_rabbitmq_password

BACKEND_DATABASE_URL=postgresql://postgres:change_this_postgres_password@postgres:5432/projectiii?schema=public
REDIS_HOST=redis
REDIS_PORT=6379

JWT_ACCESS_SECRET=change_this_access_secret_long_random
JWT_REFRESH_SECRET=change_this_refresh_secret_long_random
JWT_ACCESS_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://<SERVER_IP>:3000/api/auth/google/callback

FRONTEND_URL=http://<SERVER_IP>:3001
NEXT_PUBLIC_API_URL=http://<SERVER_IP>:3000/api
AI_SERVICE_URL=http://ai-service:8000
RABBITMQ_URL=amqp://projectiii:change_this_rabbitmq_password@rabbitmq:5672
```

### 5.2 Root `.env` mau cho production domain

Dung khi co domain, vi du `https://shop.example.com`.

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_postgres_password
POSTGRES_DB=projectiii

RABBITMQ_DEFAULT_USER=projectiii
RABBITMQ_DEFAULT_PASS=change_this_rabbitmq_password

BACKEND_DATABASE_URL=postgresql://postgres:change_this_postgres_password@postgres:5432/projectiii?schema=public
REDIS_HOST=redis
REDIS_PORT=6379

JWT_ACCESS_SECRET=change_this_access_secret_long_random
JWT_REFRESH_SECRET=change_this_refresh_secret_long_random
JWT_ACCESS_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://shop.example.com/api/auth/google/callback

FRONTEND_URL=https://shop.example.com
NEXT_PUBLIC_API_URL=https://shop.example.com/api
AI_SERVICE_URL=http://ai-service:8000
RABBITMQ_URL=amqp://projectiii:change_this_rabbitmq_password@rabbitmq:5672
```

### 5.3 AI service `.env`

File: `ai-service/.env`

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

Neu chua co `DEEPSEEK_API_KEY`, website van chay nhung chatbot AI se khong tra loi bang model that.

### 5.4 Tao secret manh

Co the tao secret bang:

```bash
openssl rand -hex 32
```

Dung output cho:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- password Postgres
- password RabbitMQ

---

## 6. Cach A - Deploy demo bang `docker-compose.yml` hien tai

Day la cach nhanh nhat.

Build va start:

```bash
docker compose up -d --build
```

Kiem tra container:

```bash
docker compose ps
```

Cho backend/frontend/ai-service len xong, xem log:

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 ai-service
```

Chay migration:

```bash
docker compose exec backend npx prisma migrate deploy
```

Neu database moi va can du lieu mau:

```bash
docker compose exec backend npm run db:seed
```

Truy cap:

- Frontend: `http://<SERVER_IP>:3001`
- Backend: `http://<SERVER_IP>:3000/api`
- AI service: `http://<SERVER_IP>:8000`
- RabbitMQ management: `http://<SERVER_IP>:15672`

Luu y: Cach A dang chay dev command (`next dev`, `start:dev`, `uvicorn --reload`), phu hop demo/staging, khong toi uu production.

---

## 7. Cach B - Deploy production/direct-port khuyen nghi

Repo da co san `docker-compose.prod.yml`.

Khac biet so voi `docker-compose.yml` dev:

- Khong bind mount source code vao container.
- Backend chay `npm run start:prod`.
- Frontend chay Next standalone image bang `node server.js`.
- AI service chay `uvicorn` khong co `--reload`.
- Postgres/Redis/RabbitMQ khong expose port ra ngoai.
- Frontend van expose `3001`, backend expose `3000`, AI service expose `8000` de test truc tiep bang port.

Luu y: `NEXT_PUBLIC_API_URL` duoc dua vao luc build frontend. Neu doi bien nay trong `.env`, can build lai frontend.

Chay production compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Neu server chi co 4GB RAM va build bi cham/het RAM, build tung service de giam peak memory:

```bash
docker compose -f docker-compose.prod.yml build ai-service
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d
```

Hoac gioi han Docker Compose build tung viec mot:

```bash
COMPOSE_PARALLEL_LIMIT=1 docker compose -f docker-compose.prod.yml up -d --build
```

Khi chi sua mot service, chi build lai service do:

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml up -d --build ai-service
```

Chay migration:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

Kiem tra:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Truy cap khi test bang port:

- Frontend: `http://<SERVER_IP>:3001`
- Backend API: `http://<SERVER_IP>:3000/api`
- AI service: `http://<SERVER_IP>:8000`

Neu chi sua `.env` backend/AI ma khong sua frontend `NEXT_PUBLIC_API_URL`, thuong chi can:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Neu sua `NEXT_PUBLIC_API_URL`, phai rebuild frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

---

## 8. Cau hinh Nginx reverse proxy HTTPS

Neu dung Nginx tren server:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Tao file:

```bash
sudo nano /etc/nginx/sites-available/projectiii
```

Noi dung mau:

```nginx
server {
    listen 80;
    server_name shop.example.com;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Bat site:

```bash
sudo ln -s /etc/nginx/sites-available/projectiii /etc/nginx/sites-enabled/projectiii
sudo nginx -t
sudo systemctl reload nginx
```

Cap SSL:

```bash
sudo certbot --nginx -d shop.example.com
```

Kiem tra renew:

```bash
sudo certbot renew --dry-run
```

Sau khi co HTTPS, cap nhat `.env`:

```env
FRONTEND_URL=https://shop.example.com
NEXT_PUBLIC_API_URL=https://shop.example.com/api
GOOGLE_CALLBACK_URL=https://shop.example.com/api/auth/google/callback
```

Build lai frontend vi `NEXT_PUBLIC_API_URL` duoc bake vao build:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend backend
```

---

## 9. Cau hinh Google OAuth neu can

Trong Google Cloud Console:

Authorized redirect URI:

```text
https://shop.example.com/api/auth/google/callback
```

Trong `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://shop.example.com/api/auth/google/callback
FRONTEND_URL=https://shop.example.com
```

Neu khong dung Google OAuth, de trong `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET`. Backend khong nen crash; endpoint Google se bao loi cau hinh.

---

## 10. Smoke test sau deploy

Neu test tren server:

```bash
curl -i http://127.0.0.1:3000/api
curl -i http://127.0.0.1:8000/
curl -I http://127.0.0.1:3001/
```

Neu test qua domain:

```bash
curl -i https://shop.example.com/api
curl -I https://shop.example.com/
curl -i "https://shop.example.com/api/products?limit=2"
curl -i "https://shop.example.com/api/categories"
curl -i "https://shop.example.com/api/recommendations/public"
```

Kiem tra migration:

```bash
docker compose exec backend npx prisma migrate status
```

Kiem tra log realtime:

```bash
docker compose logs -f backend frontend ai-service
```

---

## 11. Quy trinh update version moi

Tren may local:

```bash
git checkout develop
git pull
# test local
git checkout production
git merge develop
git push
```

Tren server:

```bash
cd ProjectIII
git checkout production
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Xem log sau update:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend frontend ai-service
```

---

## 12. Backup va restore database

Backup:

```bash
docker compose exec postgres pg_dump -U postgres projectiii > projectiii_backup_$(date +%Y%m%d_%H%M%S).sql
```

Restore:

```bash
cat projectiii_backup.sql | docker compose exec -T postgres psql -U postgres projectiii
```

Nen backup truoc khi:

- chay migration moi
- update production
- thay doi schema lon

---

## 13. Rollback code

Xem commit:

```bash
git log --oneline -10
```

Quay ve commit cu:

```bash
git checkout <COMMIT_ID_CU>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Neu rollback ve version cu nhung migration moi da thay doi DB, can restore backup hoac viet migration rollback rieng.

---

## 14. Troubleshooting loi thuong gap

### Backend khong len

Xem log:

```bash
docker compose logs --tail=200 backend
```

Kiem tra:

- `DATABASE_URL` dung chua
- Postgres da `Up` chua
- Redis/RabbitMQ da `Up` chua
- JWT secrets co bi de mac dinh khong

### Frontend goi API sai URL

Kiem tra `.env`:

```env
NEXT_PUBLIC_API_URL=https://shop.example.com/api
```

Sau khi sua `NEXT_PUBLIC_API_URL`, phai build lai frontend:

```bash
docker compose up -d --build frontend
```

### Database moi nhung khong co san pham

Chay migration:

```bash
docker compose exec backend npx prisma migrate deploy
```

Neu can du lieu mau:

```bash
docker compose exec backend npm run db:seed
```

### Chat AI khong tra loi

Kiem tra `ai-service/.env`:

```env
DEEPSEEK_API_KEY=...
```

Xem log:

```bash
docker compose logs --tail=100 ai-service
docker compose logs --tail=100 backend
```

Kiem tra backend co tro den AI service:

```env
AI_SERVICE_URL=http://ai-service:8000
```

### Google OAuth loi redirect_uri_mismatch

Kiem tra URI trong Google Console phai trung 100%:

```text
https://shop.example.com/api/auth/google/callback
```

Kiem tra `.env`:

```env
GOOGLE_CALLBACK_URL=https://shop.example.com/api/auth/google/callback
FRONTEND_URL=https://shop.example.com
```

### Nginx 502 Bad Gateway

Kiem tra container co chay khong:

```bash
docker compose ps
```

Kiem tra local port:

```bash
curl -I http://127.0.0.1:3001/
curl -i http://127.0.0.1:3000/api
```

Kiem tra Nginx:

```bash
sudo nginx -t
sudo journalctl -u nginx --no-pager -n 100
```

---

## 15. Checklist truoc khi public

- Source tren server o nhanh `production` hoac nhanh deploy on dinh.
- `.env` da tao tren server, khong commit len GitHub.
- Password Postgres/RabbitMQ/JWT da doi thanh secret manh.
- `ai-service/.env` co `DEEPSEEK_API_KEY` neu dung chat AI.
- `docker compose ps` tat ca service can thiet deu `Up`.
- `npx prisma migrate deploy` da chay thanh cong.
- Frontend vao duoc bang domain.
- Backend `/api` tra 200.
- Products/categories/recommendations API tra 200.
- HTTPS da bat.
- Google OAuth callback dung neu dung Google login.
- Postgres/Redis/RabbitMQ/AI service khong public ra internet neu khong can.
- Co backup database truoc lan public dau tien.

---

## 16. Lenh deploy nhanh tong hop

Demo/staging:

```bash
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose ps
```

Production:

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```
