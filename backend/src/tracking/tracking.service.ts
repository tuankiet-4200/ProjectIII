import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTrackingEventDto } from './dto';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async createEvent(shopOrderId: string, dto: CreateTrackingEventDto) {
    // Verify shop order exists
    const shopOrder = await this.prisma.shopOrder.findUnique({
      where: { id: shopOrderId },
    });
    if (!shopOrder) throw new NotFoundException('Shop order not found');

    // Create the tracking event
    const event = await this.prisma.trackingEvent.create({
      data: {
        shop_order_id: shopOrderId,
        event_type: dto.event_type,
        location: dto.location,
        shipper_id: dto.shipper_id,
      },
    });

    // Auto-update shop order status based on event type
    const statusMap: Record<string, string> = {
      order_packed: 'PREPARING',
      picked_up: 'SHIPPING',
      arrived_at_hub: 'SHIPPING',
      delivering: 'SHIPPING',
      delivered: 'DELIVERED',
    };

    const newStatus = statusMap[dto.event_type] as any;
    if (newStatus) {
      await this.prisma.shopOrder.update({
        where: { id: shopOrderId },
        data: { status: newStatus },
      });
    }

    // Prepare full data of the created order to find user ID
    const fullOrder = await this.prisma.shopOrder.findUnique({
      where: { id: shopOrderId },
      include: {
        parent_order: true,
      },
    });

    if (fullOrder) {
      this.notifications.emitTrackingEvent(fullOrder.parent_order.user_id, {
        shopOrderId: fullOrder.id,
        eventType: dto.event_type,
        location: dto.location,
        newStatus: newStatus || fullOrder.status,
      });
    }

    return event;
  }

  async getEventsByShopOrder(shopOrderId: string) {
    const shopOrder = await this.prisma.shopOrder.findUnique({
      where: { id: shopOrderId },
    });
    if (!shopOrder) throw new NotFoundException('Shop order not found');

    return this.prisma.trackingEvent.findMany({
      where: { shop_order_id: shopOrderId },
      include: {
        shipper: {
          select: { id: true, full_name: true, phone: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }
}
