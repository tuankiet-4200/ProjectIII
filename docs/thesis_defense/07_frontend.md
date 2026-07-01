# FRONTEND & SHIPPER APP - Next.js, Zustand, Middleware

---

## 1. Frontend Architecture (Next.js 15)

### Cấu trúc App Router

```
frontend/app/
├── (auth)/         → Layout cho trang auth (login, register)
├── (public)/       → Layout cho trang public (không cần đăng nhập)
│   ├── products/   → Danh sách sản phẩm
│   ├── product/    → Chi tiết sản phẩm
│   └── shop/       → Trang shop
├── admin/          → Dashboard Admin (yêu cầu role ADMIN)
├── vendor/         → Dashboard Vendor (yêu cầu đăng nhập)
├── seller/         → Quản lý shop
├── auth/           → Xử lý OAuth callback
├── checkout/       → Checkout (yêu cầu đăng nhập)
├── orders/         → Đơn hàng (yêu cầu đăng nhập)
└── layout.tsx      → Root layout, khởi tạo Providers
```

**Route Groups** `(auth)` và `(public)` là tính năng của Next.js App Router:
- Tên trong ngoặc không ảnh hưởng URL
- Cho phép dùng layout khác nhau cho các nhóm trang

---

## 2. Middleware - Bảo vệ Route (middleware.ts)

```typescript
/** Decode JWT payload WITHOUT verifying signature (Edge runtime safe) */
function decodeJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const jsonStr = atob(padded);  // Base64 decode
  return JSON.parse(jsonStr);
}
```

**Tại sao không verify signature?**  
Middleware chạy ở **Edge Runtime** — môi trường serverless không có Node.js crypto APIs. Không thể dùng `jsonwebtoken` hay `@nestjs/jwt`. Edge chỉ có Web APIs (`atob`, `fetch`...). Decode mà không verify đủ cho UX (redirect login/admin), bảo mật thật ở Backend.

### Routing Logic

```typescript
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  // ↑ Đọc từ Cookie (không phải localStorage — Edge không có localStorage)

  // /admin/* → cần role ADMIN
  if (pathname.startsWith("/admin")) {
    if (!accessToken) return redirectToLogin("unauthenticated");
    const payload = decodeJwt(accessToken);
    if (!payload || isTokenExpired(payload)) return redirectToLogin("session_expired");
    if (payload.role !== "ADMIN") return redirectToLogin("forbidden");
    return NextResponse.next();
  }

  // /vendor/* → cần đăng nhập, không phải SHIPPER
  if (pathname.startsWith("/vendor")) {
    if (!accessToken) return redirectToLogin("unauthenticated");
    const payload = decodeJwt(accessToken);
    if (payload?.role === "SHIPPER") return redirectToLogin("forbidden");
    return NextResponse.next();
  }

  // /checkout, /orders, /profile, /payment → cần đăng nhập
  if (pathname.startsWith("/checkout") || pathname.startsWith("/orders") ...) {
    if (!accessToken) return redirectToLogin("unauthenticated");
    ...
  }
}

// Chỉ chạy middleware cho các path này
export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/checkout/:path*", ...]
};
```

---

## 3. State Management - Zustand

### Tại sao Zustand thay vì Redux?

| Tiêu chí | Redux | Zustand |
|----------|-------|---------|
| Boilerplate | Nhiều (actions, reducers, selectors) | Ít, setup nhanh |
| Bundle size | ~8KB | ~1KB |
| Học curve | Cao | Thấp |
| Dev tools | Tốt | Tốt (tích hợp Redux DevTools) |
| Phù hợp | App lớn, phức tạp | App vừa, team nhỏ |

### useAuthStore - Quản lý Authentication

```typescript
export const useAuthStore = create<AuthState>()(
  persist(    // ← Persist sang localStorage tự động
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: async () => {
        const { refreshToken } = get();  // Lấy state hiện tại

        if (refreshToken) {
          await authService.logout(refreshToken);  // Blacklist token ở Backend
        }

        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });

        // Lazy import để tránh circular dependency
        const { useCartStore } = await import('./useCartStore');
        useCartStore.getState().clearCart();  // Xóa giỏ hàng khi logout

        // Xóa dữ liệu persistent
        localStorage.removeItem('auth-storage');
        document.cookie = 'access_token=; path=/; max-age=0';  // Xóa cookie để middleware reset
      },

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: 'auth-storage',                           // localStorage key
      storage: createJSONStorage(() => localStorage), // Serializer JSON
    }
  )
);
```

**`persist` middleware của Zustand**: Tự động serialize state sang localStorage khi thay đổi, và rehydrate khi app load lại. Người dùng không bị logout khi F5.

**Lazy import** `await import('./useCartStore')`: Tránh circular dependency (useAuthStore → useCartStore → ...). Import lúc cần thay vì import ở đầu file.

### useCartStore - Giỏ hàng Frontend

```typescript
export const useCartStore = create<CartState>((set) => ({
  groups: [],          // Sản phẩm group theo shop
  totalItems: 0,
  totalAmount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    const cart = await cartService.getCart();  // Gọi API Backend
    set({ groups: cart.groups, totalItems: cart.total_items, ... });
  },

  addItem: async (productId, quantity) => {
    await cartService.addItem(productId, quantity);
    const cart = await cartService.getCart();   // Re-fetch sau khi add
    set({ groups: cart.groups, ... });
    // ↑ Không tự tính ở frontend để tránh inconsistency với Redis
  },
}));
```

**Sau mỗi thao tác đều re-fetch cart**: Đơn giản hơn optimistic update, đảm bảo state frontend luôn khớp với Redis.

### useNotificationStore - Realtime Events

```typescript
// Idempotency: tránh duplicate khi nhận event 2 lần
pushTrackingEvent: (shopOrderId, event) => {
  set((state) => {
    const existing = state.trackingUpdates[shopOrderId] || [];
    if (existing.some((e) => e.id === event.id)) return {};  // Đã có → bỏ qua
    return { trackingUpdates: { ...state.trackingUpdates, [shopOrderId]: [event, ...existing] } };
  });
},
```

---

## 4. Kiến trúc Frontend tổng thể

```
HTTP Request →  Next.js Middleware (Edge)  →  Route
                     ↓ (nếu qua)
               Page Component (RSC hoặc Client)
                     ↓
               Zustand Store (state)
                     ↓
               Service Layer (API calls)
                     ↓
               Backend API (fetch với Authorization header)

Socket.IO →    useNotificationStore  →  UI components
               (realtime updates)
```

---

## 5. Shipper App (React Native Expo)

### Chức năng chính
- Xem danh sách đơn hàng đang giao (`getActiveDeliveries`)
- Cập nhật tracking event (picked_up, delivering, delivered) + upload ảnh bằng chứng
- Xem thông tin chi tiết đơn (địa chỉ, SĐT khách)

### Cấu trúc
```
shipper-app/
├── App.tsx          → Root: Navigation setup
├── src/
│   ├── screens/     → Màn hình (LoginScreen, OrdersScreen, TrackingScreen)
│   ├── services/    → API calls đến Backend
│   └── api.ts       → Axios base instance
```

```typescript
// src/api.ts - Base API với JWT header
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 6. Câu hỏi bảo vệ

### Q1: Tại sao middleware decode JWT mà không verify signature?
**A:** Edge Runtime không hỗ trợ Node.js crypto. Decode-only đủ cho UX redirect. Bảo mật thật phụ thuộc Backend — mọi API call đều verify signature JWT đầy đủ. Nếu attacker giả mạo JWT payload ở frontend → cookie bị sửa → bypass middleware → nhưng API Backend vẫn reject vì signature sai.

### Q2: Tại sao dùng Cookie để lưu access_token cho middleware thay vì localStorage?
**A:** Middleware (Edge Runtime) không có `window.localStorage`. Chỉ có `request.cookies` từ HTTP headers. Do đó khi setAuth, cần set cả cookie (cho middleware) và localStorage (cho Zustand persist).

### Q3: Zustand `persist` có vấn đề gì?
**A:** 
- Data trong localStorage có thể bị đọc bởi XSS
- Khi schema thay đổi → old serialized state không match → app crash. Giải pháp: `version` + `migrate` trong persist config
- Không tự sync giữa các tab (khác với Redux + localStorage)

### Q4: Next.js App Router vs Pages Router?
**A:** App Router (Next.js 13+) dùng React Server Components mặc định → render ở server, ít JS gửi về client hơn. Hỗ trợ nested layouts, route groups. Pages Router là cách cũ nhưng vẫn được support.

### Q5: Tại sao không dùng SWR hoặc React Query thay vì fetch thủ công?
**A:** Dự án dùng Zustand store làm cache, fetch thủ công trong store actions. SWR/React Query tốt hơn về cache invalidation, stale-while-revalidate, retry tự động. Đây là trade-off: đơn giản hơn nhưng ít tính năng hơn. Nên dùng React Query trong production app lớn hơn.

---

## 7. Tóm tắt 5 điểm chính

1. **Next.js App Router**: Route groups, nested layouts, RSC mặc định → ít JS bundle hơn
2. **Edge Middleware**: Decode JWT (không verify) để redirect UX — bảo mật thật ở Backend
3. **Zustand persist**: State auth/cart tự động save localStorage, rehydrate khi F5
4. **Cookie dual-storage**: access_token cần lưu cả cookie (middleware) và localStorage (Zustand)
5. **Realtime integration**: useNotificationStore nhận WebSocket events, cập nhật UI ngay lập tức
