# REALTIME - WebSocket, Notifications, Tracking

---

## 1. Chức năng

Module `notifications` cung cấp **kênh giao tiếp realtime** 2 chiều giữa Server và Client bằng **Socket.IO** (WebSocket với polling fallback). Được dùng cho:

| Sự kiện | Trigger | Người nhận |
|---------|---------|------------|
| `order_checkout_success/failed` | Sau RabbitMQ xử lý xong | Customer |
| `orderStatusChanged` | Shop cập nhật trạng thái | Customer |
| `trackingEvent` | Shipper tạo tracking event | Customer |
| `newChatMessage` | User/Shop/Bot gửi tin | Shop owner / Customer |

---

## 2. Luồng kết nối WebSocket

```
Frontend load trang (đã đăng nhập)
↓
useNotificationStore khởi tạo Socket.IO client:
  socket = io(API_URL, {
    auth: { token: accessToken }  ← Gửi JWT khi kết nối
  })
↓
Server: NotificationsGateway.handleConnection(client)
  1. Đọc token: client.handshake.auth.token
  2. jwtService.verify(token) → decode payload → lấy userId
  3. client.join("user_{userId}") → join vào Room riêng
     ↑ Mỗi user có 1 Room. Server emit đến Room → chỉ user đó nhận
  4. userSockets.set(userId, [client.id]) → track socket IDs
↓
Kết nối thành lập
↓
Server emit sự kiện → client.to("user_{userId}").emit(event, data)
↓
Frontend nhận event → cập nhật useNotificationStore → UI re-render
```

---

## 3. Giải thích NotificationsGateway

```typescript
@WebSocketGateway({
  cors: { origin: '*' },  // Cho phép mọi origin kết nối WS
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;  // Đối tượng Socket.IO Server, dùng để emit events

  // Map: userId → [socketId1, socketId2, ...]
  // Lý do: 1 user có thể mở nhiều tab/cửa sổ → nhiều socket connections
  private userSockets: Map<string, string[]> = new Map();
```

### handleConnection - Xác thực khi kết nối

```typescript
async handleConnection(client: Socket) {
  const token = client.handshake.auth?.token || client.handshake.query?.token;
  //  ↑ Hỗ trợ 2 cách gửi token: auth object hoặc query string

  if (!token) {
    client.disconnect();  // Từ chối kết nối không có token
    return;
  }

  const decoded = this.jwtService.verify(token);
  // ↑ Verify JWT signature. Nếu token giả hoặc hết hạn → throw → disconnect

  client.join(`user_${userId}`);
  // ↑ Đây là cơ chế quan trọng: Socket.IO "Room"
  //   server.to("user_123").emit(...) → chỉ socket trong room này nhận
  //   Không cần biết socketId cụ thể, chỉ cần userId

  const existingSockets = this.userSockets.get(userId) || [];
  this.userSockets.set(userId, [...existingSockets, client.id]);
  // ↑ Lưu để track "user X đang online"
}
```

### handleDisconnect - Cleanup khi ngắt kết nối

```typescript
handleDisconnect(client: Socket) {
  const userId = client.data?.user?.sub;
  if (userId) {
    const existingSockets = this.userSockets.get(userId) || [];
    const updatedSockets = existingSockets.filter((id) => id !== client.id);
    // ↑ Xóa socket ID này khỏi list, giữ lại các socket khác (tab khác)

    if (updatedSockets.length === 0) {
      this.userSockets.delete(userId);  // User không còn kết nối nào
    } else {
      this.userSockets.set(userId, updatedSockets);
    }
  }
}
```

### Các emit methods

```typescript
emitOrderStatusChanged(userId: string, payload: any) {
  this.server.to(`user_${userId}`).emit('orderStatusChanged', payload);
  // ↑ Emit đến Room "user_{userId}" → tất cả tab của user đó nhận
}

emitTrackingEvent(userId: string, payload: any) {
  this.server.to(`user_${userId}`).emit('trackingEvent', payload);
}

emitChatMessage(userId: string, payload: any) {
  this.server.to(`user_${userId}`).emit('newChatMessage', payload);
}
```

---

## 4. Luồng Tracking vận chuyển

```
Shipper mở app di động (React Native)
↓
Shipper scan đơn hàng → nhập event_type: "picked_up", location: "HCM"
↓
POST /api/tracking/shop-orders/{shopOrderId}/events
  { event_type, location, proof_image }
↓
TrackingService.createEvent(shopOrderId, user, dto):

  BƯỚC 1: Kiểm tra quyền
  if (user.role !== 'ADMIN' && user.role !== 'SHIPPER') {
    if (shopOrder.shop.owner_id !== user.id) throw ForbiddenException
  }
  // → Admin và Shipper có quyền tạo event cho mọi đơn
  // → Shop owner chỉ được tạo event cho đơn của shop mình

  BƯỚC 2: Tạo TrackingEvent trong DB
  prisma.trackingEvent.create({ shop_order_id, event_type, location, shipper_id })

  BƯỚC 3: Tự động cập nhật trạng thái ShopOrder
  statusMap = {
    "order_packed": "PREPARING",
    "picked_up": "SHIPPING",
    "delivered": "DELIVERED",
    ...
  }
  prisma.shopOrder.update({ status: newStatus })

  BƯỚC 4: Emit realtime cho Customer
  notifications.emitTrackingEvent(customerId, event)
  notifications.emitOrderStatusChanged(customerId, { orderId, status })
↓
Frontend Customer nhận event → cập nhật UI tracking timeline
```

---

## 5. useNotificationStore - Frontend State

```typescript
export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],          // Thông báo hiển thị cho user
  orderStatusUpdates: {},     // { shopOrderId: status }  (realtime)
  trackingUpdates: {},        // { shopOrderId: TrackingEvent[] }
  chatMessages: {},           // { sessionId: Message[] }

  pushTrackingEvent: (shopOrderId, event) => {
    set((state) => {
      const existing = state.trackingUpdates[shopOrderId] || [];
      if (existing.some((e) => e.id === event.id)) return {};
      // ↑ Idempotency check: tránh duplicate nếu nhận event 2 lần
      return {
        trackingUpdates: {
          ...state.trackingUpdates,
          [shopOrderId]: [event, ...existing],  // Newest first
        },
      };
    });
  },
}));
```

---

## 6. Dependency Graph

```
NotificationsGateway
  └── JwtService (verify token khi kết nối WS)

Được inject vào:
  ├── OrdersService (emit checkout result)
  ├── OrdersProcessor (emit checkout result từ queue)
  ├── TrackingService (emit tracking events)
  └── ChatService (emit chat messages)

Frontend:
  useNotificationStore
    ← nhận events từ Socket.IO client
    ← cung cấp state cho tất cả components
```

---

## 7. Câu hỏi bảo vệ

### Q1: Tại sao dùng Socket.IO thay vì WebSocket thuần?
**A:** Socket.IO = WebSocket + fallback (long polling khi WS bị block bởi proxy/firewall) + auto-reconnect + Room/Namespace built-in + broadcast utilities. WebSocket thuần không có Room concept → phải tự implement user→socket mapping.

### Q2: Room trong Socket.IO là gì?
**A:** Room là một label ảo để group các sockets. `socket.join("user_123")` → socket đó thuộc room "user_123". `server.to("user_123").emit(event)` → gửi đến tất cả sockets trong room đó. Không cần biết socket ID cụ thể.

### Q3: Nếu user mở 2 tab thì socket nào nhận?
**A:** Cả 2 tab đều nhận vì cả 2 socket đều join room `user_{userId}`. `userSockets` map lưu danh sách socket IDs để track `isUserOnline()`.

### Q4: Nếu user offline khi có tracking event thì sao?
**A:** Event bị mất, không được deliver. Khi user online lại, frontend phải **polling** API để lấy lịch sử tracking. Socket.IO không có persistent message delivery. Giải pháp: lưu notification vào DB và load khi user connect lại.

### Q5: Tại sao verify JWT ở WebSocket gateway thay vì dùng JwtAuthGuard?
**A:** `JwtAuthGuard` là HTTP Guard, không apply cho WebSocket. Phải implement xác thực thủ công trong `handleConnection`. Ngoài ra, WS connection là persistent nên chỉ cần verify 1 lần khi kết nối, không phải mỗi message.

### Q6: CORS cho WebSocket được cấu hình thế nào?
**A:** `@WebSocketGateway({ cors: { origin: '*' } })` cho phép mọi origin. Trong production nên restrict về domain cụ thể. Nginx cũng cần cấu hình proxy_set_header để WebSocket hoạt động qua reverse proxy.

---

## 8. Tóm tắt 5 điểm chính

1. **Socket.IO Room**: Mỗi user join room `user_{id}` → server emit targeted đến đúng user
2. **JWT authentication**: Verify token khi WS connect → chặn kết nối trái phép
3. **Multi-tab support**: `userSockets` Map lưu nhiều socket IDs → 1 user nhiều tab
4. **Auto status update**: TrackingService tự map `event_type` → `ShopOrderStatus`
5. **Frontend Zustand store**: `useNotificationStore` nhận events realtime, cập nhật UI ngay lập tức
