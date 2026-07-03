# REBUILD ROADMAP — Multi-Vendor E-Commerce Platform
> Senior Architect Mentorship Guide — Rebuild from scratch to master software engineering.

---

## ARCHITECTURE OVERVIEW

```
Browser/Mobile
     │ HTTPS
  Nginx (Reverse Proxy + SSL)
     ├── /* → Next.js Frontend
     ├── /api/* → NestJS Backend
     └── /gps-tracking/* → Socket.IO GPS namespace
          │
     NestJS Backend
     ├── REST Controllers
     ├── WebSocket Gateway (Socket.IO)
     ├── RabbitMQ Consumer (OrdersProcessor)
     └── HTTP call → FastAPI AI Service
          │
     ┌────┬────┬─────────┐
  PostgreSQL Redis RabbitMQ  FastAPI+DeepSeek
```

**Module dependency order (must build in sequence):**
```
Infrastructure → Auth → Users → Shops → Categories → Products
→ Cart → Coupons → Orders → Reviews → Wishlist
→ Notifications → Chat → AI Service → Recommendations → Tracking
→ Frontend Pages → Mobile App → Docker Deploy
```

---

## MODULE 1 — Project Foundation & Infrastructure

**Purpose:** Set up the monorepo structure, Docker environment, and establish patterns all other modules follow.

**Why at this stage:** Every other module depends on DB connection, config management, and folder structure. Get this right first.

**Prerequisites:** Node.js, Docker, basic NestJS, basic Next.js.

**Database tables:** None yet.

**Docker impact:**
- `docker-compose.yml` with: `postgres`, `redis`, `rabbitmq`, `backend`, `ai-service`, `frontend`
- Each service gets its own `Dockerfile`
- Shared `.env` file with all secrets

### Development Checklist

**Backend (NestJS)**
- [ ] `nest new backend` — initialize NestJS project
- [ ] Install: `@prisma/client`, `prisma`, `@nestjs/config`, `class-validator`, `class-transformer`
- [ ] Set up `ConfigModule` (global) to read `.env`
- [ ] Create `PrismaModule` as a global singleton provider
- [ ] Create `RedisModule` — wrap `ioredis` as a provider
- [ ] Create global validation pipe (`useGlobalPipes`)
- [ ] Create global exception filter for consistent error responses
- [ ] Set up CORS in `main.ts`

**Frontend (Next.js)**
- [ ] `npx create-next-app@latest frontend` with TypeScript + App Router
- [ ] Install: `axios`, `zustand`, `socket.io-client`
- [ ] Set up `axiosInstance` with base URL from env
- [ ] Create `api.ts` central HTTP client

**Infrastructure**
- [ ] `docker-compose.yml`: postgres:16, redis:7, rabbitmq:3-management
- [ ] `.env.example` with all required keys
- [ ] `Makefile` with shortcuts: `make up`, `make down`, `make logs`

**Testing**
- [ ] `docker compose up` — all services start without error
- [ ] Prisma connects to PostgreSQL
- [ ] Redis `PING` → `PONG`
- [ ] RabbitMQ Management UI accessible at port 15672

**Source files to study AFTER completing this module:**
- `backend/src/prisma/` — compare your singleton pattern
- `backend/src/redis/` — compare your Redis provider
- `docker-compose.yml` — compare service definitions and networking

---

## MODULE 2 — Database Schema Design (Prisma)

**Purpose:** Define the complete data model before writing any business logic. All subsequent modules reference this schema.

**Why at this stage:** Schema changes are cheap now, expensive later. Design everything upfront.

**Prerequisites:** Module 1 complete. Understanding of relational databases, foreign keys, ENUMs.

**Key design decisions to make:**
- Use UUID (not integer) for all primary keys → not guessable, distributed-system safe
- `price_at_purchase` Snapshot Pattern → store price at time of purchase, not reference to current price
- 2-level order structure: `ParentOrder` → `ShopOrder[]` → `OrderItem[]` (Order Splitting)
- Self-referencing `Category` for tree structure
- `UserRole` ENUM: only `CUSTOMER`, `ADMIN`, `SHIPPER` — Vendor is a state (has a shop), not a role

**Tables to design (in dependency order):**
1. `users` (id, email, password_hash, full_name, phone, role, is_banned)
2. `user_addresses` (id, user_id FK, label, full_address, is_default)
3. `categories` (id, name, slug, parent_id self-FK, icon)
4. `shops` (id, owner_id FK→users, name, slug, logo_url, is_active)
5. `products` (id, shop_id FK, category_id FK, name, slug, price, stock_quantity, sales_count, images TEXT[])
6. `user_interactions` (id, user_id FK, product_id FK, interaction_type ENUM)
7. `wishlists` (id, user_id FK, product_id FK)
8. `coupons` (id, code UNIQUE, shop_id nullable FK, type ENUM, value, min_order_amount, max_discount, expires_at)
9. `coupon_usages` (id, coupon_id FK, user_id FK)
10. `parent_orders` (id, user_id FK, total_payment, payment_status ENUM, payment_method ENUM, shipping_address)
11. `shop_orders` (id, parent_order_id FK, shop_id FK, shipping_fee, status ENUM)
12. `order_items` (id, shop_order_id FK, product_id FK, quantity, price_at_purchase)
13. `tracking_events` (id, shop_order_id FK, shipper_id FK, event_type, location, proof_image)
14. `reviews` (id, user_id FK, product_id FK, rating INT, comment)
15. `chat_sessions` (id, customer_id FK, shop_id FK)
16. `chat_messages` (id, session_id FK, sender_id FK, content, sender_type ENUM)

### Development Checklist

**Prisma Schema**
- [ ] Write `schema.prisma` with all 16 tables
- [ ] Define all ENUMs: `UserRole`, `PaymentStatus`, `PaymentMethod`, `ShopOrderStatus`, `InteractionType`
- [ ] Set up all relations with correct `onDelete` behavior
- [ ] Run `prisma migrate dev --name init`
- [ ] Run `prisma generate` to get type-safe client
- [ ] Open `prisma studio` and verify tables are created

**Testing**
- [ ] All 16 tables exist in PostgreSQL
- [ ] Relations are correct (FK constraints work)
- [ ] `prisma studio` shows all models

**Source files to study AFTER:**
- `backend/prisma/schema.prisma` — compare your schema design choice by choice

---

## MODULE 3 — Authentication

**Purpose:** Secure the entire API. Every protected endpoint depends on this.

**Why at this stage:** Auth is the foundation of authorization. No other user-specific feature works without it.

**Prerequisites:** Modules 1-2 complete. Understand JWT, bcrypt, HTTP cookies vs localStorage.

**Database tables:** `users`

**Backend APIs:**
- `POST /api/auth/register` — create user
- `POST /api/auth/login` — issue access + refresh tokens
- `POST /api/auth/refresh` — exchange refresh token for new access token
- `POST /api/auth/logout` — blacklist refresh token in Redis
- `GET /api/auth/google` — start Google OAuth flow
- `GET /api/auth/google/callback` — handle Google OAuth callback

**Redis usage:**
- Key: `auth:blacklist:refresh:{sha256(token)}` = `"1"` with TTL = token remaining lifetime
- On every protected request: check if token is blacklisted before validating JWT

**State management (Frontend):**
- `useAuthStore`: `{ user, accessToken, setUser, setToken, logout }`
- Persist to `localStorage` with Zustand `persist` middleware
- Axios interceptor: auto-attach `Authorization: Bearer {token}` header
- Axios response interceptor: on 401, call `/auth/refresh` then retry original request

**Frontend pages:**
- `/login` — email/password form
- `/register` — registration form
- `/auth/google` — redirect button

### Development Checklist

**Backend**
- [ ] Install `@nestjs/passport`, `passport-jwt`, `passport-local`, `passport-google-oauth20`
- [ ] Install `@nestjs/jwt`, `bcrypt`, `@types/bcrypt`
- [ ] `JwtStrategy` — validate JWT, load user from DB, attach to `req.user`
- [ ] `JwtAuthGuard` — protect routes, apply globally or per-controller
- [ ] `RolesGuard` + `@Roles()` decorator for role-based access
- [ ] `@CurrentUser()` param decorator to extract user from request
- [ ] `AuthService.register()` — hash password with bcrypt (cost 10)
- [ ] `AuthService.login()` — verify password, issue dual tokens (15min access, 7d refresh)
- [ ] `AuthService.refresh()` — check blacklist, verify refresh token, issue new access token
- [ ] `AuthService.logout()` — blacklist refresh token in Redis with TTL
- [ ] `GoogleStrategy` — handle OAuth2 callback, create user if not exists

**Frontend**
- [ ] `useAuthStore` with Zustand + persist
- [ ] `axiosInstance` with request interceptor (attach token)
- [ ] Response interceptor: refresh token on 401
- [ ] Login page with form validation
- [ ] Register page with form validation
- [ ] Next.js `middleware.ts` for route protection (Edge Runtime)
- [ ] Redirect unauthenticated users from protected pages

**Testing**
- [ ] Register → receive user object
- [ ] Login → receive access_token + refresh_token
- [ ] Call protected API with access_token → 200
- [ ] Call with expired/wrong token → 401
- [ ] Logout → blacklist token
- [ ] Call with blacklisted token → 401
- [ ] Refresh → new access_token

**Source files to study AFTER:**
- `backend/src/auth/` — all files
- `backend/src/common/guards/` — RolesGuard, JwtAuthGuard
- `backend/src/common/decorators/` — CurrentUser, Roles
- `frontend/store/useAuthStore.ts`
- `frontend/middleware.ts`

---

## MODULE 4 — Users & Shops

**Purpose:** User profile management and shop registration/approval flow.

**Why at this stage:** Products and orders reference both users and shops. Must exist first.

**Prerequisites:** Module 3 (Auth). Understanding of "Vendor = Customer with a shop" pattern.

**Database tables:** `users`, `user_addresses`, `shops`

**Key architectural insight:** There is NO `VENDOR` role in the database. Any `CUSTOMER` who registers a shop becomes a vendor. Backend checks `shop.owner_id === userId` at service layer to authorize vendor actions.

**Backend APIs:**
- `GET /api/users/me` — get own profile
- `PATCH /api/users/me` — update profile
- `POST /api/users/me/addresses` — add address
- `GET /api/users/me/addresses` — list addresses
- `DELETE /api/users/me/addresses/:id` — remove address
- `POST /api/shops` — register a shop (customer becomes vendor)
- `GET /api/shops/:slug` — public shop page
- `PATCH /api/shops/:id` — vendor updates own shop
- `GET /api/admin/shops` — admin list all shops
- `PATCH /api/admin/shops/:id/approve` — admin approves shop

**Frontend pages:**
- `/profile` — user profile editor
- `/profile/addresses` — address management
- `/vendor/register` — shop registration form
- `/vendor/dashboard` — vendor home (after shop approved)
- `/shops/:slug` — public shop page

**State management:** User data in `useAuthStore`. Shop data fetched on-demand (no global store needed).

### Development Checklist

**Backend**
- [ ] `UsersModule` with `UsersService`, `UsersController`
- [ ] `ShopsModule` with `ShopsService`, `ShopsController`
- [ ] `UsersService.findById()` used by `JwtStrategy`
- [ ] `UsersService.updateProfile()` — update name, phone, avatar
- [ ] Address CRUD (belongs to user, max 5 addresses, one default)
- [ ] `ShopsService.create()` — create shop, link to user via `owner_id`
- [ ] `ShopsService.findByOwnerId()` — vendor checks their own shop
- [ ] Authorization: `shop.owner_id !== userId → ForbiddenException`
- [ ] Admin endpoint: list shops with `is_active` filter
- [ ] Admin endpoint: approve/reject shop

**Frontend**
- [ ] Profile page with update form
- [ ] Address list with add/delete
- [ ] Shop registration form
- [ ] Vendor route group — check if user has active shop, else redirect to registration
- [ ] Admin shop approval table with Approve/Reject buttons

**Testing**
- [ ] Create shop as CUSTOMER
- [ ] Try to update someone else's shop → 403
- [ ] Admin approves shop → `is_active = true`
- [ ] Vendor dashboard accessible after approval

**Source files to study AFTER:**
- `backend/src/shops/shops.service.ts` — owner_id authorization pattern
- `backend/src/users/`
- `frontend/middleware.ts` — how vendor routes are protected
- `frontend/app/(vendor)/` — vendor route group

---

## MODULE 5 — Categories & Products

**Purpose:** The core product catalog. Everything commerce-related depends on products.

**Why at this stage:** Cart, Orders, Reviews, Recommendations all reference products.

**Prerequisites:** Modules 1-4. Understanding of slug-based routing, pagination, filtering.

**Database tables:** `categories`, `products`, `user_interactions`

**Backend APIs:**
- `GET /api/categories` — list all (tree structure)
- `POST /api/admin/categories` — admin creates category
- `GET /api/products` — list with filters (category, shop, price range, sort, search, page)
- `GET /api/products/:slug` — product detail page
- `POST /api/shops/:shopId/products` — vendor creates product
- `PATCH /api/products/:id` — vendor updates own product
- `DELETE /api/products/:id` — vendor deletes own product
- `POST /api/products/:id/interact` — log VIEW/ADD_TO_CART/PURCHASE interaction

**Frontend pages:**
- `/` (home) — featured products, categories
- `/products` — product listing with filters sidebar
- `/products/[slug]` — product detail page
- `/vendor/products` — vendor product management table
- `/vendor/products/new` — create product form
- `/vendor/products/[id]/edit` — edit product form

**State management:** No global store for products — fetch per page with URL search params (Next.js `useSearchParams`).

**Key concepts to implement:**
- Slug generation: `"Nike Air Max 90" → "nike-air-max-90"` (unique in DB)
- Pagination: `skip = (page - 1) * limit`, return `{ data, total, page, limit }`
- Full-text search: PostgreSQL `ILIKE '%keyword%'` across name + description
- Image upload: `POST /api/uploads` → returns URL array → store in `product.images TEXT[]`

### Development Checklist

**Backend**
- [ ] `CategoriesModule` — self-referencing tree query
- [ ] `ProductsModule` — full CRUD
- [ ] `UploadsModule` — handle `multipart/form-data`, save files, return public URLs
- [ ] Product list query builder: filter by `category_id`, `shop_id`, `min_price`, `max_price`, `sort`, `search`
- [ ] Vendor authorization on product update/delete: `product.shop.owner_id !== userId`
- [ ] `InteractionsService.logInteraction()` — upsert or create `user_interaction` row
- [ ] Log `VIEW` interaction when product detail is fetched (if user authenticated)

**Frontend**
- [ ] Category tree display in sidebar
- [ ] Product card component (image, name, price, rating, shop)
- [ ] Product grid with infinite scroll or pagination
- [ ] Filter sidebar: price range slider, category select, sort dropdown
- [ ] Product detail page: image gallery, description, add to cart button
- [ ] `useEffect` on product page → call `POST /products/:id/interact { type: 'VIEW' }`
- [ ] Vendor product table with create/edit/delete
- [ ] Multi-image upload component

**Testing**
- [ ] Create product as vendor → appears in public listing
- [ ] Filter by category → correct results
- [ ] Search by keyword → relevant results
- [ ] View product page → interaction logged in DB
- [ ] Edit someone else's product → 403

**Source files to study AFTER:**
- `backend/src/products/products.service.ts` — query builder pattern
- `backend/src/categories/`
- `backend/src/uploads/`
- `frontend/app/(public)/products/` — listing and detail pages

---

## MODULE 6 — Shopping Cart (Redis Hash)

**Purpose:** Fast, ephemeral cart storage. Changes frequently, doesn't need ACID.

**Why at this stage:** Cart is needed before Checkout. Redis Hash per user is optimal.

**Prerequisites:** Modules 1-5. Understand Redis Hash operations.

**Database tables:** None (cart lives in Redis only)

**Redis usage:**
- Key pattern: `cart:{userId}` → Hash
- Field: `productId`, Value: `quantity` (string)
- `HSET cart:user123 product-abc 3` — add/update item O(1)
- `HGET cart:user123 product-abc` — get quantity O(1)
- `HDEL cart:user123 product-abc` — remove item O(1)
- `HGETALL cart:user123` — get full cart O(N)

**Backend APIs:**
- `GET /api/cart` — read cart (HGETALL + join product details from DB)
- `POST /api/cart/items` — add item (validate stock, HSET, log ADD_TO_CART interaction)
- `PATCH /api/cart/items/:productId` — update quantity
- `DELETE /api/cart/items/:productId` — remove item
- `DELETE /api/cart` — clear entire cart

**State management:** `useCartStore` (Zustand) — `{ groups, totalItems, totalAmount }`. After every mutation, call GET cart to re-sync from server.

**Key constraints to enforce:**
- Validate `product.stock_quantity >= requested_quantity` before adding
- Validate `existing_qty + new_qty <= stock_quantity` to prevent over-adding
- Group cart items by shop in `GET /api/cart` response

### Development Checklist

**Backend**
- [ ] `CartModule` with `CartService`, `CartController`
- [ ] `CartService.addItem()` — validate stock twice (new qty alone + total in cart), HSET
- [ ] `CartService.addItem()` — also log `ADD_TO_CART` interaction to DB
- [ ] `CartService.getCart()` — HGETALL, fetch product details, group by shop
- [ ] `CartService.updateItem()` — validate new total vs stock, HSET
- [ ] `CartService.removeItem()` — HDEL
- [ ] `CartService.clearCart()` — DEL key

**Frontend**
- [ ] `useCartStore` with Zustand
- [ ] Cart icon in navbar showing `totalItems` badge
- [ ] Cart drawer/page showing items grouped by shop
- [ ] Quantity stepper (+/-) with debounced PATCH call
- [ ] Remove item button
- [ ] Proceed to checkout button

**Testing**
- [ ] Add item → appears in cart
- [ ] Add same item again → quantity increases
- [ ] Try to add more than stock → error
- [ ] Remove item → gone from cart
- [ ] Cart persists across page refresh (Redis survives)

**Source files to study AFTER:**
- `backend/src/cart/cart.service.ts` — double-stock-check pattern
- `frontend/store/useCartStore.ts` — sync pattern (mutate + re-fetch)

---

## MODULE 7 — Coupons

**Purpose:** Discount codes for both platform-wide (Admin) and per-shop (Vendor).

**Why at this stage:** Coupons are applied at checkout time. Implement before Orders.

**Prerequisites:** Modules 1-5.

**Database tables:** `coupons`, `coupon_usages`

**Key business rules:**
- `shop_id = null` → platform coupon (Admin only can create)
- `shop_id = X` → applies only to products from shop X
- `type = PERCENTAGE` → value is %, capped by `max_discount`
- `type = FIXED_AMOUNT` → flat deduction, cannot exceed order total
- Validation: `min_order_amount`, `expires_at`, `is_active`
- Track usage in `coupon_usages` (prevent reuse per user if needed)

**Backend APIs:**
- `POST /api/admin/coupons` — admin creates platform coupon
- `POST /api/vendor/shops/:shopId/coupons` — vendor creates shop coupon
- `GET /api/coupons/validate?code=SAVE10` — check if valid for current user/cart

### Development Checklist

**Backend**
- [ ] `CouponsModule` — CRUD for both admin and vendor
- [ ] Validation: check `is_active`, `expires_at >= now()`, `min_order_amount`
- [ ] Calculate discount: PERCENTAGE with max cap, FIXED_AMOUNT with floor
- [ ] `coupon_usages` — record after successful use (in transaction with order creation)
- [ ] `GET /validate` endpoint: return discount amount preview for frontend

**Frontend**
- [ ] Coupon input field in checkout page
- [ ] Show discount preview when valid code entered
- [ ] Error message for invalid/expired codes

**Source files to study AFTER:**
- `backend/src/orders/orders.processor.ts` — how coupon logic runs inside transaction

---

## MODULE 8 — Orders & Checkout (RabbitMQ)

**Purpose:** The most complex module. Implements async order processing to avoid HTTP timeout.

**Why at this stage:** Depends on Cart, Coupons, Products, Notifications.

**Prerequisites:** Modules 1-7. Understand RabbitMQ producer/consumer, Prisma transactions, Optimistic Locking.

**Database tables:** `parent_orders`, `shop_orders`, `order_items`

**RabbitMQ usage:**
- Producer: `OrdersService.checkout()` → `rmqClient.emit('order.create', payload)`
- Consumer: `OrdersProcessor.handleOrderCreate()` → processes heavy logic in background
- Pattern: `emit()` (fire & forget), NOT `send()` (request-reply)

**Socket.IO usage:**
- After processor completes: `socket.to('user_{userId}').emit('order_checkout_success', ...)`
- On failure: `socket.to('user_{userId}').emit('order_checkout_failed', ...)`

**2-Phase checkout flow:**
```
Phase 1 (HTTP < 200ms):
  Read Redis cart → Create ParentOrder{total=0} → Emit RabbitMQ → Delete cart → Return 202

Phase 2 (Background 1-5s):
  Fetch products → Group by shop → $transaction {
    Validate+apply coupon (record usage)
    calculateOrderTotals(subtotal, discount) → shipping + tax
    Update ParentOrder.total_payment
    For each shop: Create ShopOrder + OrderItems
    UPDATE products SET stock -= qty WHERE stock >= qty  ← Optimistic Lock
    If updated.count = 0 → THROW → ROLLBACK ALL
  }
  On success → WebSocket notify
  On failure → Delete ParentOrder → WebSocket notify
```

**Order totals formula:**
- Free shipping threshold: subtotal >= 200,000đ → shipping = 0 else 12,000đ
- Tax: subtotal × 3.5%
- Total = subtotal - discount + shipping + tax

### Development Checklist

**Backend**
- [ ] Install `@nestjs/microservices`, `amqplib`
- [ ] Register RabbitMQ `ClientProxy` in `OrdersModule`
- [ ] `OrdersController.checkout()` — Phase 1 only, returns immediately
- [ ] `OrdersProcessor` decorated with `@EventPattern('order.create')`
- [ ] `calculateOrderTotals()` helper function (pure, testable)
- [ ] Prisma `$transaction` wrapping coupon + order creation + stock decrement
- [ ] Optimistic locking: `updateMany WHERE stock >= qty` → check `count === 0`
- [ ] On failure: delete ParentOrder, emit failure socket event
- [ ] `GET /api/orders` — paginated order history
- [ ] `GET /api/orders/:id` — order detail with items and tracking events
- [ ] `GET /api/vendor/shops/:shopId/orders` — vendor sees their shop's orders
- [ ] `PATCH /api/shop-orders/:id/status` — vendor updates order status

**Frontend**
- [ ] Checkout page: address selector, payment method, coupon input
- [ ] On submit → POST checkout → show "Processing..." state
- [ ] Subscribe to `order_checkout_success` / `order_checkout_failed` socket events
- [ ] Redirect to order detail page on success
- [ ] Order history page with status badges
- [ ] Order detail page showing items, timeline, totals
- [ ] Vendor: orders management table with status update buttons

**Testing**
- [ ] Checkout with valid cart → order appears in history
- [ ] Two users buy last item simultaneously → only one succeeds
- [ ] Coupon applied → discount in total
- [ ] Stock decremented in DB after successful order
- [ ] Checkout with empty cart → 400 error

**Source files to study AFTER:**
- `backend/src/orders/orders.service.ts` — Phase 1 logic
- `backend/src/orders/orders.processor.ts` — Phase 2 logic
- `backend/src/orders/order-totals.ts` — formula
- `frontend/store/useNotificationStore.ts` — WebSocket event handling

---

## MODULE 9 — Reviews & Wishlist

**Purpose:** Social proof (reviews) and user engagement (wishlist).

**Why at this stage:** Simple CRUD modules. Implement after orders since reviews need purchase verification.

**Database tables:** `reviews`, `wishlists`

**Backend APIs:**
- `POST /api/products/:id/reviews` — create review (should verify purchase)
- `GET /api/products/:id/reviews` — list reviews with average rating
- `POST /api/wishlist/:productId` — toggle wishlist (add if not exists, remove if exists)
- `GET /api/wishlist` — get user's wishlist

### Development Checklist

**Backend**
- [ ] `ReviewsModule` — create, list, (optionally: verify purchased before allow)
- [ ] Calculate average rating on product query (Prisma `_avg` aggregate)
- [ ] `WishlistModule` — toggle pattern (upsert with unique constraint)
- [ ] Return `isWishlisted: boolean` in product detail API

**Frontend**
- [ ] Star rating input component
- [ ] Review list below product detail
- [ ] Heart button on product cards (filled = wishlisted)
- [ ] Wishlist page listing all saved products

**Source files to study AFTER:**
- `backend/src/reviews/`
- `backend/src/wishlist/`

---

## MODULE 10 — Notifications Gateway (Socket.IO)

**Purpose:** Real-time push events from server to specific users. Used by Orders, Chat, Tracking.

**Why at this stage:** Must exist before Chat and Tracking which emit events.

**Prerequisites:** Modules 1-3. Understand Socket.IO rooms and namespaces.

**Socket.IO design:**
- On connect: verify JWT in `handshake.auth.token`, join room `user_{userId}`
- `userSockets` Map in memory: `userId → socketId[]` (support multiple tabs)
- Helper methods: `emitOrderStatusChanged()`, `emitTrackingEvent()`, `emitChatMessage()`
- On disconnect: remove from `userSockets` Map

**Events emitted by server:**
| Event name | Trigger | Payload |
|---|---|---|
| `order_checkout_success` | Order processed | `{ parentOrderId, totalPayment }` |
| `order_checkout_failed` | Order failed | `{ message }` |
| `orderStatusChanged` | Vendor/shipper updates status | `{ orderId, status, shopName }` |
| `trackingEvent` | Shipper creates tracking event | `{ shopOrderId, event_type, location }` |
| `newChatMessage` | Other party sends message | `{ sessionId, content, senderType }` |

### Development Checklist

**Backend**
- [ ] Install `@nestjs/platform-socket.io`, `socket.io`
- [ ] `NotificationsGateway` with `@WebSocketGateway({ cors: '*' })`
- [ ] `handleConnection()` — verify JWT, join `user_{userId}` room
- [ ] `handleDisconnect()` — clean up `userSockets` Map
- [ ] `isUserOnline(userId)` utility method
- [ ] `emitOrderStatusChanged()`, `emitTrackingEvent()`, `emitChatMessage()` helper methods

**Frontend**
- [ ] Socket connection in a React Context or hook
- [ ] Connect on auth, disconnect on logout
- [ ] `useNotificationStore` (Zustand) — `{ notifications, unreadCount, push, markRead }`
- [ ] Toast notification component triggered by socket events
- [ ] Notification bell in navbar

**Testing**
- [ ] Connect with valid token → joined room
- [ ] Connect with invalid token → disconnected immediately
- [ ] Emit event to `user_X` room → only user X receives it
- [ ] Multiple tabs → all receive the event

**Source files to study AFTER:**
- `backend/src/notifications/notifications.gateway.ts`
- `frontend/store/useNotificationStore.ts`

---

## MODULE 11 — Chat & AI Chatbot

**Purpose:** Live chat between customer and shop. AI auto-replies using shop product context.

**Why at this stage:** Depends on Notifications Gateway (to emit `newChatMessage`).

**Prerequisites:** Modules 1-5, 10. Understand async background processing with IIFE.

**Database tables:** `chat_sessions`, `chat_messages`

**AI interaction flow:**
```
Customer sends message → Saved to DB → Emitted to shop via WebSocket
↓ (Background, non-blocking via IIFE)
Extract keywords from message → SQL LIKE query → fetch matching products
→ Build system prompt: "You are shop X assistant. Products: [context]"
→ POST to FastAPI AI Service → DeepSeek API → AI reply
→ Save AI message to DB → Emit to customer via WebSocket
```

**Backend APIs:**
- `POST /api/chat/sessions` — create session (customer → shop)
- `GET /api/chat/sessions` — list sessions (customer sees own, vendor sees shop's)
- `GET /api/chat/sessions/:id/messages` — message history
- `POST /api/chat/sessions/:id/messages` — send message (triggers AI if shop message)

**AI Service (FastAPI Python):**
- `POST /predict` — accepts `{ message, context, history }`, returns `{ reply }`
- Calls DeepSeek API with system prompt + user message
- System prompt injects product context as plain text

### Development Checklist

**Backend (NestJS ChatModule)**
- [ ] `ChatModule` with `ChatService`, `ChatController`
- [ ] `ChatService.createSession()` — find or create session for customer+shop pair
- [ ] `ChatService.sendMessage()` — save customer message, emit to shop via socket
- [ ] IIFE pattern: after emitting customer message, start AI background process WITHOUT awaiting
- [ ] `getShopProductsContext()` — extract keywords, SQL LIKE, format products list
- [ ] HTTP call to FastAPI `/predict` with message + context + history
- [ ] Save AI reply to DB, emit to customer via socket

**AI Service (Python FastAPI)**
- [ ] `fastapi` + `httpx` + `python-dotenv`
- [ ] `POST /predict` endpoint
- [ ] System prompt template with shop name + product context injected
- [ ] Call DeepSeek API (OpenAI-compatible format)
- [ ] Return `{ reply: string }`

**Frontend**
- [ ] Chat list page (customer: all sessions, vendor: all shop sessions)
- [ ] Chat room component: message bubbles, input box, send button
- [ ] Subscribe to `newChatMessage` socket event → append message to UI
- [ ] Show "AI is typing..." indicator while AI processes
- [ ] Differentiate customer / shop / AI messages visually

**Testing**
- [ ] Customer opens chat with shop → session created
- [ ] Customer sends message → appears in shop's chat view
- [ ] AI auto-replies within 3-5 seconds
- [ ] AI reply references actual products from the shop

**Source files to study AFTER:**
- `backend/src/chat/chat.service.ts` — IIFE pattern for background AI
- `ai-service/routers/chat.py` — prompt engineering
- `frontend/app/(public)/chat/` — real-time chat UI

---

## MODULE 12 — Recommendations

**Purpose:** Personalized product suggestions based on user interaction history.

**Why at this stage:** Requires `user_interactions` data (populated since Module 5).

**Algorithm (Interaction-based Scoring with Recency Decay):**
```
For each of last 50 interactions (newest first):
  baseWeight = PURCHASE:8, ADD_TO_CART:5, VIEW:1
  recencyWeight = max(0.35, 1 - index * 0.03)
  score = baseWeight * recencyWeight
  categoryScores[category_id] += score
  shopScores[shop_id] += score

Query products WHERE:
  id NOT IN interactedProductIds   ← exclude already seen
  category_id IN topCategories OR shop_id IN topShops

Rank by: (categoryScore * 3) + shopScore + (sales_count * 0.01)
Return top 16. Pad with trending (ORDER BY sales_count DESC) if < 16.
Fallback for new users: return trending products directly.
```

**Backend APIs:**
- `GET /api/recommendations` — personalized or trending

### Development Checklist

**Backend**
- [ ] `RecommendationsModule` with `RecommendationsService`
- [ ] `getRecommendations(userId, query)` — full algorithm above
- [ ] `getTrendingProducts(query, excludeIds)` — fallback query
- [ ] `getInteractionWeight(type)` — pure helper function

**Frontend**
- [ ] "Recommended for You" section on homepage
- [ ] Fetch on homepage load

**Source files to study AFTER:**
- `backend/src/recommendations/recommendations.service.ts` — scoring algorithm

---

## MODULE 13 — Order Tracking & GPS

**Purpose:** Two-layer tracking: milestone events (DB) + live GPS (Redis + Socket.IO).

**Why at this stage:** Depends on Orders (shop_orders), Notifications (WebSocket).

**Two mechanisms:**
1. **Tracking Events** (DB-persisted) — shipper manually marks milestones
2. **GPS Streaming** (Redis + Socket.IO namespace) — automatic every 5-10 seconds

**Socket.IO GPS namespace:** `/gps-tracking` (separate from default namespace)
- Shipper emits `updateLocation` → saved to Redis `location:{shopOrderId}` TTL 2h → broadcast to `tracking_{shopOrderId}` room
- Customer emits `joinTrackingRoom` → joins room, receives last known location from Redis immediately

**Tracking event types → status mapping:**
- `order_packed` → PREPARING
- `ready_for_pickup` → READY_FOR_PICKUP
- `picked_up` → SHIPPING
- `arrived_at_hub` → SHIPPING
- `delivering` → SHIPPING
- `delivered` → DELIVERED

**Map (Frontend):** Leaflet + React-Leaflet + OpenStreetMap tiles (free, no API key). Geocode address to coordinates using Nominatim API.

### Development Checklist

**Backend**
- [ ] `TrackingGateway` with `/gps-tracking` namespace
- [ ] `handleUpdateLocation()` — save to Redis, broadcast to room
- [ ] `handleJoinRoom()` — join room, replay last known location from Redis
- [ ] `TrackingService.createEvent()` — validate auth, save event, auto-update status, emit 2 socket events
- [ ] `TrackingService.getActiveDeliveries(shipperId)` — deliveries this shipper has touched

**Frontend**
- [ ] Order detail page: tracking timeline (list of events with timestamps)
- [ ] `TrackingMap` component with Leaflet
- [ ] Show shipper position (truck icon) updating in real-time
- [ ] Show delivery destination (house icon)
- [ ] Draw polyline between shipper and destination
- [ ] On mount: join tracking room, show last known location

**Mobile (Shipper App)**
- [ ] `expo-location` — `watchPositionAsync()` every 10s or 10m movement
- [ ] Emit `updateLocation` via Socket.IO `/gps-tracking` namespace
- [ ] Scan QR → extract shopOrderId → call `POST /shop-orders/:id/tracking { event_type: 'picked_up' }`
- [ ] Buttons: "At Hub", "Delivering", "Delivered" → each calls tracking API
- [ ] "Delivered" → trigger `expo-image-picker` for POD photo → upload → include URL in tracking event

**Testing**
- [ ] Create tracking event → order status updates
- [ ] Customer receives `trackingEvent` WebSocket event
- [ ] Shipper streams GPS → customer map updates live
- [ ] Customer joins mid-delivery → sees current position immediately from Redis

**Source files to study AFTER:**
- `backend/src/tracking/tracking.service.ts`
- `backend/src/tracking/tracking.gateway.ts`
- `frontend/components/TrackingMap.tsx`
- `shipper-app/src/screens/DashboardScreen.tsx`

---

## MODULE 14 — Docker & Production Deploy

**Purpose:** Package everything into reproducible containers and deploy to VPS.

**Why at this stage:** All modules built and tested locally first.

**Prerequisites:** All previous modules. Understand Docker networking, Nginx reverse proxy, SSL.

**Docker services:**
- `postgres:16-alpine` — database
- `redis:7-alpine` — cache
- `rabbitmq:3-management` — message queue
- `backend` — custom NestJS image, depends on all above
- `ai-service` — custom FastAPI image
- `frontend` — custom Next.js image
- `nginx` — reverse proxy, SSL termination

**Nginx config responsibilities:**
- Route `/api/` and `/socket.io/` to backend container
- Route `/*` to frontend container
- Handle SSL termination with Let's Encrypt certificates
- WebSocket upgrade headers for Socket.IO

### Development Checklist

**Docker**
- [ ] `Dockerfile` for backend (multi-stage: build + production)
- [ ] `Dockerfile` for ai-service (Python slim)
- [ ] `Dockerfile` for frontend (Next.js standalone output)
- [ ] `docker-compose.yml` with health checks and `depends_on`
- [ ] `.dockerignore` for all services
- [ ] `docker-compose.prod.yml` with production overrides

**Nginx**
- [ ] `nginx.conf` with `upstream` blocks for backend and frontend
- [ ] WebSocket proxy headers: `Upgrade`, `Connection`
- [ ] SSL certificate paths from Let's Encrypt

**VPS Deployment**
- [ ] Install Docker + Docker Compose on VPS
- [ ] Clone repo, create `.env` with production secrets
- [ ] Run `certbot` for SSL certificate
- [ ] `docker compose up -d`
- [ ] Run `prisma migrate deploy` inside backend container

**Source files to study AFTER:**
- `docker-compose.yml` in project root
- `nginx/nginx.conf`
- Each service's `Dockerfile`

---

## 100-STEP ROADMAP

| # | Step | Module | Difficulty (1-5) | Est. Hours | Knowledge Required | Common Mistakes | How to Verify |
|---|------|--------|-----------------|------------|-------------------|-----------------|---------------|
| 1 | Init NestJS project | 1 | 1 | 1h | NestJS CLI | Wrong module structure | `npm run start:dev` runs |
| 2 | Set up ConfigModule + .env | 1 | 1 | 1h | dotenv | Hardcoding secrets | `configService.get('DB_URL')` works |
| 3 | Create PrismaModule singleton | 1 | 2 | 2h | DI, singleton | Multiple instances | Single connection in logs |
| 4 | Create RedisModule (ioredis) | 1 | 2 | 2h | Redis, DI | No error handling | `redis.ping()` returns PONG |
| 5 | Set up Docker Compose (infra) | 1 | 2 | 3h | Docker, networking | Port conflicts | All containers healthy |
| 6 | Init Next.js frontend | 1 | 1 | 1h | Next.js App Router | Using Pages Router | `npm run dev` on 3001 |
| 7 | Set up axiosInstance + interceptors | 1 | 2 | 2h | Axios | Missing base URL | API calls include auth header |
| 8 | Write Prisma schema (all 16 tables) | 2 | 2 | 4h | SQL, relations, ENUM | Circular deps, wrong FK | `prisma migrate dev` succeeds |
| 9 | Run first migration | 2 | 1 | 0.5h | Prisma migrate | Running in wrong dir | 16 tables in DB |
| 10 | Verify schema with Prisma Studio | 2 | 1 | 0.5h | Prisma Studio | — | All models visible |
| 11 | AuthModule skeleton + DTOs | 3 | 2 | 1h | NestJS modules | Missing imports | Module loads without error |
| 12 | Implement bcrypt register | 3 | 2 | 2h | bcrypt | Storing plain text password | `password_hash` in DB |
| 13 | Implement JWT login (dual token) | 3 | 3 | 3h | JWT, signing | Same secret for both tokens | Access+refresh returned |
| 14 | JwtStrategy + JwtAuthGuard | 3 | 3 | 2h | Passport | Guard not applied | Protected route returns 401 without token |
| 15 | RolesGuard + @Roles decorator | 3 | 2 | 2h | NestJS guards | Wrong guard order | ADMIN-only route rejects CUSTOMER |
| 16 | Redis token blacklist (logout) | 3 | 3 | 2h | Redis TTL | Not computing remaining TTL | Blacklisted token rejected |
| 17 | Refresh token endpoint | 3 | 3 | 2h | JWT verification | Not checking blacklist | Fresh access token returned |
| 18 | Google OAuth strategy | 3 | 3 | 3h | OAuth2, Passport | Wrong callback URL | Google login creates/finds user |
| 19 | useAuthStore (Zustand + persist) | 3 | 2 | 2h | Zustand | Missing hydration | Token survives page reload |
| 20 | Axios 401 retry interceptor | 3 | 3 | 2h | Axios interceptors | Infinite retry loop | Expired token auto-refreshed |
| 21 | Login/Register pages | 3 | 2 | 3h | Next.js forms | No validation | Submit calls API, stores token |
| 22 | Next.js middleware route protection | 3 | 3 | 2h | Edge Runtime, JWT | Blocking public pages | Unauthenticated → /login redirect |
| 23 | UsersModule — profile CRUD | 4 | 2 | 2h | REST patterns | Exposing password_hash | GET /me returns safe user object |
| 24 | User addresses CRUD | 4 | 2 | 2h | FK relations | No ownership check | User can only modify own addresses |
| 25 | ShopsModule — create shop | 4 | 2 | 2h | owner_id pattern | Missing auth guard | Shop created with owner_id = userId |
| 26 | Shop authorization (owner_id check) | 4 | 2 | 1h | ForbiddenException | Using role instead of owner | Other user gets 403 |
| 27 | Admin shop approval endpoint | 4 | 1 | 1h | RolesGuard | — | `is_active` flips to true |
| 28 | Vendor route group (middleware) | 4 | 2 | 2h | Next.js route groups | — | Unapproved vendor redirected |
| 29 | CategoriesModule (tree query) | 5 | 2 | 2h | Self-referencing FK | N+1 query | Nested category tree returned |
| 30 | UploadsModule (multipart) | 5 | 2 | 3h | Multer, file storage | No size validation | File URL returned after upload |
| 31 | ProductsModule — CRUD | 5 | 2 | 4h | Pagination | Missing includes | Product with shop+category |
| 32 | Product list query builder (filters) | 5 | 3 | 3h | Prisma where builder | Filter not optional | Each filter independently works |
| 33 | Product slug generation | 5 | 2 | 1h | String manipulation | Duplicates | Unique slug in DB |
| 34 | Vendor product authorization | 5 | 2 | 1h | Owner check | — | Edit own product OK, other's 403 |
| 35 | InteractionsService.logInteraction | 5 | 2 | 1h | DB write | — | Row in user_interactions table |
| 36 | Auto-log VIEW on product detail | 5 | 2 | 1h | Conditional logic | Logging for unauthenticated | Only logged if token present |
| 37 | Product listing page (frontend) | 5 | 2 | 4h | React, URL params | Ignoring filter params | Filter changes update product list |
| 38 | Product detail page | 5 | 2 | 3h | Next.js dynamic routes | — | Product info + reviews displayed |
| 39 | Multi-image upload component | 5 | 3 | 3h | File API | Large files | Multiple images uploaded |
| 40 | Vendor product management table | 5 | 2 | 3h | React table | — | CRUD operations work |
| 41 | CartModule — addItem (Redis HSET) | 6 | 2 | 2h | Redis Hash | — | Item appears in cart |
| 42 | Double stock validation in cart | 6 | 3 | 1h | Business logic | Only one check | Over-quantity rejected |
| 43 | ADD_TO_CART interaction logged | 6 | 1 | 0.5h | — | — | Row in interactions table |
| 44 | getCart — HGETALL + product join | 6 | 2 | 2h | Redis + DB join | — | Cart grouped by shop |
| 45 | useCartStore (Zustand) | 6 | 2 | 2h | Zustand | Not re-fetching after mutate | Cart count badge updates |
| 46 | Cart UI (drawer + quantity stepper) | 6 | 2 | 3h | React | — | Add/remove/update works |
| 47 | CouponsModule — admin create | 7 | 2 | 2h | FK nullable | — | Platform coupon created |
| 48 | Vendor shop coupon | 7 | 2 | 1h | Owner check | — | Shop coupon created |
| 49 | Coupon validation endpoint | 7 | 2 | 2h | Business logic | Not checking expiry | Valid/invalid response |
| 50 | Install + configure RabbitMQ client | 8 | 3 | 2h | AMQP, NestJS microservices | Wrong queue name | Connection established |
| 51 | Checkout Phase 1 (emit to RMQ) | 8 | 3 | 3h | Fire-and-forget emit | Using send() instead of emit() | 202 returned immediately |
| 52 | OrdersProcessor @EventPattern | 8 | 3 | 2h | Consumer pattern | — | Message received after emit |
| 53 | Group products by shop in processor | 8 | 2 | 1h | Map grouping | — | Correct shop groups |
| 54 | calculateOrderTotals helper | 8 | 2 | 1h | Pure function | Rounding errors | Correct totals for various inputs |
| 55 | Prisma $transaction for order | 8 | 4 | 4h | ACID transactions | Missing error handling | All-or-nothing behavior |
| 56 | Coupon logic inside transaction | 8 | 3 | 2h | Transactional reads | Reading outside tx | Coupon usage recorded atomically |
| 57 | Optimistic locking (updateMany WHERE stock>=qty) | 8 | 4 | 2h | SQL conditions | Using SELECT then UPDATE | Last-item race condition resolved |
| 58 | Rollback on failure + delete ParentOrder | 8 | 3 | 2h | Error handling | Orphaned orders | Failed order cleaned up |
| 59 | Clear cart from Redis after checkout | 8 | 1 | 0.5h | HDEL / DEL | Clearing too early | Cart empty after order |
| 60 | Order history + detail APIs | 8 | 2 | 2h | Includes | — | Full order with items returned |
| 61 | Vendor order management API | 8 | 2 | 1h | Owner check | — | Shop sees only own orders |
| 62 | Checkout frontend page | 8 | 2 | 4h | React forms | — | Form → API → Processing state |
| 63 | Order history + detail pages | 8 | 2 | 3h | Next.js | — | Orders listed with status |
| 64 | ReviewsModule | 9 | 2 | 2h | FK, aggregates | — | Review saved, avg rating returned |
| 65 | WishlistModule (toggle pattern) | 9 | 2 | 1h | Upsert + unique | — | Toggle add/remove works |
| 66 | Star rating UI component | 9 | 2 | 2h | React | — | Interactive star selector |
| 67 | Heart/wishlist button on product | 9 | 2 | 1h | React state | — | Filled heart = wishlisted |
| 68 | NotificationsGateway setup | 10 | 3 | 3h | Socket.IO, WS | CORS issues | Client connects successfully |
| 69 | JWT verification on WS connect | 10 | 3 | 2h | Socket.IO handshake | — | Invalid token → disconnect |
| 70 | Room joining + userSockets Map | 10 | 2 | 1h | Socket.IO rooms | Memory leaks on disconnect | User in correct room |
| 71 | Emit helper methods | 10 | 1 | 1h | — | — | Events reach correct user |
| 72 | Socket.IO client connection (frontend) | 10 | 2 | 2h | socket.io-client | Reconnection | Connected shown in devtools |
| 73 | useNotificationStore + toast UI | 10 | 2 | 2h | Zustand | — | Toast appears on socket event |
| 74 | Order success/failure socket events wired up | 10 | 2 | 1h | — | — | Toast after checkout |
| 75 | ChatModule — session management | 11 | 2 | 2h | Upsert | — | Session created or found |
| 76 | Send message + emit to other party | 11 | 2 | 2h | Socket emit | — | Message appears in shop view |
| 77 | IIFE background AI processing | 11 | 4 | 3h | Async/await, IIFE | Blocking response | Customer message returns immediately |
| 78 | getShopProductsContext (keyword SQL) | 11 | 3 | 2h | SQL LIKE | — | Context has relevant products |
| 79 | FastAPI project setup | 11 | 2 | 2h | FastAPI, Python | — | `uvicorn main:app` starts |
| 80 | DeepSeek API integration | 11 | 2 | 2h | OpenAI-compatible API | Wrong model name | AI response returned |
| 81 | System prompt with context injection | 11 | 3 | 2h | Prompt engineering | Generic prompt | AI answers about shop products |
| 82 | Chat UI with real-time messages | 11 | 2 | 4h | React, socket | — | Messages appear instantly |
| 83 | RecommendationsService scoring | 12 | 4 | 4h | Scoring algorithm | Division by zero | Personalized list differs per user |
| 84 | Trending fallback | 12 | 2 | 1h | ORDER BY | — | New user sees trending |
| 85 | Recommendations on homepage | 12 | 1 | 1h | React | — | Products shown on home |
| 86 | TrackingGateway /gps-tracking namespace | 13 | 3 | 3h | WS namespaces | Using default namespace | GPS namespace separate |
| 87 | updateLocation → Redis + broadcast | 13 | 3 | 2h | Redis TTL | No TTL set | Location in Redis, broadcast works |
| 88 | joinTrackingRoom + replay from Redis | 13 | 3 | 2h | Redis read | — | Last position sent on join |
| 89 | TrackingService.createEvent | 13 | 3 | 3h | Multi-auth check | — | Event saved, status updated |
| 90 | Tracking timeline UI (order detail) | 13 | 2 | 2h | React | — | Events listed chronologically |
| 91 | Leaflet map component | 13 | 3 | 3h | Leaflet, SSR | Next.js SSR crash | Map renders, no hydration error |
| 92 | Live position marker update | 13 | 3 | 2h | Socket + Leaflet | — | Marker moves on map |
| 93 | Shipper App — Expo setup | 13 | 2 | 2h | Expo, React Native | — | `expo start` shows QR |
| 94 | Shipper login screen | 13 | 2 | 2h | AsyncStorage | — | Token persisted, stays logged in |
| 95 | QR scan → accept order | 13 | 3 | 3h | expo-camera, Socket | — | Scan → event created → order active |
| 96 | GPS watchPositionAsync + emit | 13 | 3 | 3h | expo-location, Socket | Battery drain | Location updates visible on map |
| 97 | POD photo upload on delivered | 13 | 3 | 2h | expo-image-picker | Large files | Image URL stored in tracking event |
| 98 | Write Dockerfiles (all services) | 14 | 3 | 4h | Docker multi-stage | Wrong workdir | Images build successfully |
| 99 | docker-compose.yml production config | 14 | 3 | 3h | Compose, networking | Service startup order | All services start in correct order |
| 100 | Nginx + SSL (Let's Encrypt) | 14 | 3 | 3h | Nginx, certbot | WebSocket not proxied | HTTPS works, WS connects |

---

## WEEKLY PROGRESS TRACKER (13 Weeks)

### Week 1 — Foundation & Schema
- [ ] Step 1: Init NestJS project
- [ ] Step 2: ConfigModule + .env
- [ ] Step 3: PrismaModule singleton
- [ ] Step 4: RedisModule
- [ ] Step 5: Docker Compose (infra services)
- [ ] Step 6: Init Next.js frontend
- [ ] Step 7: axiosInstance + interceptors
- [ ] Step 8: Write full Prisma schema
- [ ] Step 9: First migration
- [ ] Step 10: Verify with Prisma Studio

### Week 2 — Authentication
- [ ] Step 11: AuthModule skeleton
- [ ] Step 12: bcrypt register
- [ ] Step 13: JWT login (dual token)
- [ ] Step 14: JwtStrategy + JwtAuthGuard
- [ ] Step 15: RolesGuard + @Roles decorator
- [ ] Step 16: Redis token blacklist
- [ ] Step 17: Refresh token endpoint
- [ ] Step 18: Google OAuth
- [ ] Step 19: useAuthStore (Zustand)
- [ ] Step 20: Axios 401 retry interceptor
- [ ] Step 21: Login/Register pages
- [ ] Step 22: Next.js route protection middleware

### Week 3 — Users, Shops & Categories
- [ ] Step 23: Users profile CRUD
- [ ] Step 24: User addresses CRUD
- [ ] Step 25: ShopsModule — create shop
- [ ] Step 26: Shop authorization (owner_id)
- [ ] Step 27: Admin shop approval
- [ ] Step 28: Vendor route group middleware
- [ ] Step 29: CategoriesModule (tree query)

### Week 4 — Products
- [ ] Step 30: UploadsModule
- [ ] Step 31: ProductsModule CRUD
- [ ] Step 32: Product list query builder
- [ ] Step 33: Slug generation
- [ ] Step 34: Vendor product authorization
- [ ] Step 35: InteractionsService
- [ ] Step 36: Auto-log VIEW interaction
- [ ] Step 37: Product listing page
- [ ] Step 38: Product detail page
- [ ] Step 39: Multi-image upload component
- [ ] Step 40: Vendor product management table

### Week 5 — Cart & Coupons
- [ ] Step 41: CartModule addItem (Redis)
- [ ] Step 42: Double stock validation
- [ ] Step 43: ADD_TO_CART interaction
- [ ] Step 44: getCart (HGETALL + join)
- [ ] Step 45: useCartStore
- [ ] Step 46: Cart UI
- [ ] Step 47: Coupons admin create
- [ ] Step 48: Vendor shop coupon
- [ ] Step 49: Coupon validation endpoint

### Week 6 — Orders (Backend)
- [ ] Step 50: RabbitMQ client setup
- [ ] Step 51: Checkout Phase 1
- [ ] Step 52: OrdersProcessor
- [ ] Step 53: Group products by shop
- [ ] Step 54: calculateOrderTotals helper
- [ ] Step 55: Prisma $transaction
- [ ] Step 56: Coupon logic in transaction
- [ ] Step 57: Optimistic locking
- [ ] Step 58: Rollback + delete on failure
- [ ] Step 59: Clear cart after checkout
- [ ] Step 60: Order history/detail APIs
- [ ] Step 61: Vendor order management API

### Week 7 — Orders (Frontend) + Reviews + Wishlist
- [ ] Step 62: Checkout frontend page
- [ ] Step 63: Order history + detail pages
- [ ] Step 64: ReviewsModule
- [ ] Step 65: WishlistModule
- [ ] Step 66: Star rating UI
- [ ] Step 67: Wishlist button

### Week 8 — Notifications & Chat Backend
- [ ] Step 68: NotificationsGateway
- [ ] Step 69: JWT verification on WS connect
- [ ] Step 70: Room joining + userSockets Map
- [ ] Step 71: Emit helper methods
- [ ] Step 72: Socket.IO client (frontend)
- [ ] Step 73: useNotificationStore + toast
- [ ] Step 74: Wire checkout socket events
- [ ] Step 75: ChatModule sessions
- [ ] Step 76: Send message + emit

### Week 9 — AI Service & Chat Frontend
- [ ] Step 77: IIFE background AI processing
- [ ] Step 78: getShopProductsContext
- [ ] Step 79: FastAPI project setup
- [ ] Step 80: DeepSeek API integration
- [ ] Step 81: System prompt context injection
- [ ] Step 82: Chat UI with real-time messages

### Week 10 — Recommendations & Tracking Backend
- [ ] Step 83: RecommendationsService scoring
- [ ] Step 84: Trending fallback
- [ ] Step 85: Recommendations on homepage
- [ ] Step 86: TrackingGateway /gps-tracking
- [ ] Step 87: updateLocation → Redis + broadcast
- [ ] Step 88: joinTrackingRoom + Redis replay
- [ ] Step 89: TrackingService.createEvent

### Week 11 — Tracking Frontend + Shipper Mobile App
- [ ] Step 90: Tracking timeline UI
- [ ] Step 91: Leaflet map component
- [ ] Step 92: Live position marker
- [ ] Step 93: Expo shipper app setup
- [ ] Step 94: Shipper login screen
- [ ] Step 95: QR scan → accept order
- [ ] Step 96: GPS watchPosition + emit
- [ ] Step 97: POD photo upload

### Week 12 — Admin Dashboard + Integration Testing
- [ ] Admin: User management table (ban/unban)
- [ ] Admin: Analytics dashboard (sales, orders, shop count)
- [ ] Admin: Global coupon management
- [ ] End-to-end test: register → shop → product → checkout → track → review
- [ ] Race condition test: 2 users buy last item simultaneously
- [ ] WebSocket test: all realtime flows working

### Week 13 — Docker & Production
- [ ] Step 98: Dockerfiles for all services
- [ ] Step 99: docker-compose.yml production
- [ ] Step 100: Nginx + SSL (Let's Encrypt)
- [ ] Deploy to VPS
- [ ] Run `prisma migrate deploy` on production DB
- [ ] Smoke test all critical paths on live server
- [ ] Final review: compare your implementation with the reference project
