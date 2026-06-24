# ProjectIII Deployment Guide

Tai lieu nay huong dan cach dua ProjectIII len server tu source code tren GitHub.

## 1. Co can tao nhanh rieng de deploy khong?

Khong bat buoc phai co code khac cho deploy.

Khuyen nghi:

- `develop`: nhanh phat trien va test tinh nang.
- `main` hoac `production`: nhanh on dinh de deploy.
- `deploy/*`: nhanh tam thoi neu can thu nghiem cau hinh deploy.

Nguyen tac quan trong:

- Khong commit file `.env` that len GitHub.
- Khong hard-code credential vao source.
- Code app nen giong nhau giua local va production.
- Moi truong deploy chi khac o `.env`, domain, secrets, Docker command, reverse proxy va database volume.

Neu muon tao nhanh deploy tu `develop`:

```bash
git checkout develop
git pull
git checkout -b production
git push -u origin production
```

Sau nay khi `develop` da on:

```bash
git checkout production
git merge develop
git push
```

## 2. Luu y ve Docker Compose hien tai

File `docker-compose.yml` hien tai phu hop cho local/dev:

- Backend chay `npm run start:dev`.
- Frontend chay `npm run dev`.
- AI service chay `uvicorn --reload`.
- Backend/frontend/AI co bind mount source code vao container.

Dung file nay de demo tren server van duoc, nhung neu deploy production that thi nen tao them `docker-compose.prod.yml` de:

- Bo bind mount source code.
- Backend chay image build san voi `npm run start:prod`.
- Frontend chay `npm start`.
- AI service bo `--reload`.
- Cau hinh restart policy.
- Dat secrets manh.
- Dat domain/reverse proxy HTTPS.

## 3. Chuan bi server

Server can co:

- Git
- Docker Engine
- Docker Compose V2
- Toi thieu 2 CPU va 4GB RAM de build/chay on dinh
- Domain tro ve IP server neu muon public web
- Firewall mo cong can thiet

Kiem tra Docker:

```bash
docker --version
docker compose version
```

## 4. Clone source tren server

```bash
git clone <REPO_URL>
cd ProjectIII
git checkout production
```

Neu chua co nhanh `production`, co the deploy truc tiep tu `develop` trong giai do demo:

```bash
git checkout develop
```

## 5. Tao file moi truong

Tao `.env` o thu muc goc:

```bash
cp .env.example .env
```

Tao `.env` cho AI service:

```bash
cp ai-service/.env.example ai-service/.env
```

Sua `.env` root:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<MAT_KHAU_POSTGRES_MANH>
POSTGRES_DB=projectiii

RABBITMQ_DEFAULT_USER=<RABBITMQ_USER>
RABBITMQ_DEFAULT_PASS=<RABBITMQ_PASSWORD_MANH>

BACKEND_DATABASE_URL=postgresql://postgres:<MAT_KHAU_POSTGRES_MANH>@postgres:5432/projectiii?schema=public
REDIS_HOST=redis
REDIS_PORT=6379

JWT_ACCESS_SECRET=<JWT_ACCESS_SECRET_MANH>
JWT_REFRESH_SECRET=<JWT_REFRESH_SECRET_MANH>
JWT_ACCESS_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=7d

FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
AI_SERVICE_URL=http://ai-service:8000
RABBITMQ_URL=amqp://<RABBITMQ_USER>:<RABBITMQ_PASSWORD_MANH>@rabbitmq:5672

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

Sua `ai-service/.env`:

```env
DEEPSEEK_API_KEY=<DEEPSEEK_API_KEY>
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

Neu chua dung Google OAuth, co the de trong:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Backend da duoc xu ly de khong crash khi thieu Google credential. Endpoint Google se tra loi loi cau hinh thay vi lam sap server.

## 6. Chay Docker Compose

Build va start toan bo service:

```bash
docker compose up -d --build
```

Kiem tra container:

```bash
docker compose ps
```

Xem log:

```bash
docker compose logs -f backend frontend ai-service
```

## 7. Chay Prisma migration

Sau khi container backend da len:

```bash
docker compose exec backend npx prisma migrate deploy
```

Kiem tra trang thai migration:

```bash
docker compose exec backend npx prisma migrate status
```

Neu database moi hoan toan va can du lieu mau:

```bash
docker compose exec backend npm run db:seed
```

## 8. Smoke test sau deploy

Kiem tra backend:

```bash
curl -i http://localhost:3000/api
```

Kiem tra AI service:

```bash
curl -i http://localhost:8000/
```

Kiem tra frontend:

```bash
curl -I http://localhost:3001/
```

Kiem tra API public:

```bash
curl -i "http://localhost:3000/api/products?limit=2"
curl -i "http://localhost:3000/api/categories"
curl -i "http://localhost:3000/api/recommendations/public"
```

Neu dung domain va reverse proxy, thay `localhost` bang domain production.

## 9. Reverse proxy va HTTPS

Voi production, nen dung Nginx/Caddy/Traefik de public domain.

Goi y routing:

- `https://your-domain.com` -> frontend container `projectiii_frontend:3000`
- `https://your-domain.com/api` -> backend container `projectiii_backend:3000/api`
- Khong public AI service ra internet neu khong can.
- Khong public Postgres, Redis, RabbitMQ ra internet.

Neu dung Google OAuth, callback tren Google Console phai trung:

```text
https://your-domain.com/api/auth/google/callback
```

Va `.env`:

```env
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

## 10. Cap nhat version moi tren server

```bash
git checkout production
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose ps
```

Xem log sau khi update:

```bash
docker compose logs --tail=100 backend frontend ai-service
```

## 11. Rollback nhanh

Xem commit gan nhat:

```bash
git log --oneline -5
```

Quay ve commit cu:

```bash
git checkout <COMMIT_ID_CU>
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

Luu y: rollback code khong tu dong rollback database schema. Neu migration moi da thay doi schema theo cach khong tuong thich, can co migration rollback rieng hoac restore backup database.

## 12. Backup database

Backup Postgres:

```bash
docker compose exec postgres pg_dump -U postgres projectiii > projectiii_backup.sql
```

Restore:

```bash
cat projectiii_backup.sql | docker compose exec -T postgres psql -U postgres projectiii
```

Nen backup truoc khi:

- Chay migration moi.
- Cap nhat production.
- Thay doi schema lon.

## 13. Checklist truoc khi public

- `.env` tren server da dung secrets manh.
- Khong commit `.env` that len GitHub.
- `docker compose ps` tat ca service can thiet deu `Up`.
- `npx prisma migrate deploy` da chay thanh cong.
- Frontend vao duoc.
- Backend `/api` tra 200.
- Products/categories/recommendations API tra 200.
- Chat AI co `DEEPSEEK_API_KEY` hop le neu muon dung chat that.
- Google OAuth co credential dung neu muon bat dang nhap Google.
- Domain da tro dung IP.
- HTTPS da bat.
- Postgres/Redis/RabbitMQ khong bi public ra internet neu khong can.

## 14. Huong deploy toi uu hon ve sau

Nen tao them:

- `docker-compose.prod.yml`
- `.env.production.example`
- Nginx/Caddy config mau
- CI/CD GitHub Actions build va deploy tu nhanh `production`

Khi do lenh deploy co the gon thanh:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec backend npx prisma migrate deploy
```
