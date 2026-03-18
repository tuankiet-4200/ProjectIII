import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/gps-tracking',
})
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * 1. Customer join room to track order
   */
  @SubscribeMessage('joinTrackingRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shopOrderId: string },
  ) {
    const room = `tracking_${data.shopOrderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);

    // Get the latest location from Redis and return it to the client
    const lastLocation = await this.redisService.get(`location:${data.shopOrderId}`);
    if (lastLocation) {
        client.emit('locationUpdated', JSON.parse(lastLocation));
    }
    
    return { event: 'joinedRoom', room };
  }

  /**
   * 2. Shipper app scans GPS coordinates (every 5-10 seconds) and sends them to the server
   */
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shopOrderId: string; lat: number; lng: number },
  ) {
    const { shopOrderId, lat, lng } = data;
    const locationData = { lat, lng, timestamp: new Date().toISOString() };

    // Save location to Redis (Hot Data)
    // Set TTL to 2 hours (7200 seconds). After 2 hours, the data will automatically disappear to free up RAM
    await this.redisService.set(
      `location:${shopOrderId}`,
      JSON.stringify(locationData),
      7200,
    );

    // Broadcast the new location to all customers in the tracking room for this order
    this.server.to(`tracking_${shopOrderId}`).emit('locationUpdated', locationData);
  }
}
