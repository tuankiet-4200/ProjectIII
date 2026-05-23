import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // Map user IDs to their socket instance IDs
  private userSockets: Map<string, string[]> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('Notifications Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client disconnected (no token): ${client.id}`);
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      client.data.user = decoded; // Store for later use

      // Join the user to a specific room based on their ID
      // This allows us to broadcast messages specifically to to them 
      client.join(`user_${userId}`);
      
      // Also keep a mapping in memory
      const existingSockets = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, [...existingSockets, client.id]);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Client connection failed: ${client.id} - ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.sub;
    
    if (userId) {
      const existingSockets = this.userSockets.get(userId) || [];
      const updatedSockets = existingSockets.filter((id) => id !== client.id);
      
      if (updatedSockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, updatedSockets);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Check if a specific user is currently connected via socket.
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.length > 0;
  }

  /**
   * Send a real-time order status update to a specific user (customer or shop owner)
   */
  emitOrderStatusChanged(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('orderStatusChanged', payload);
    this.logger.debug(`Emitted orderStatusChanged to user_${userId}`);
  }

  /**
   * Send a package tracking event to a specific user
   */
  emitTrackingEvent(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('trackingEvent', payload);
    this.logger.debug(`Emitted trackingEvent to user_${userId}`);
  }

  /**
   * Send a real-time chat message to a specific user
   */
  emitChatMessage(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('newChatMessage', payload);
    this.logger.debug(`Emitted newChatMessage to user_${userId}`);
  }
}
