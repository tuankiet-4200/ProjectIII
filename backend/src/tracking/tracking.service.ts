import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTrackingEventDto } from './dto';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async createEvent(shopOrderId: string, user: any, dto: CreateTrackingEventDto) {
    // Verify shop order exists
    const shopOrder = await this.prisma.shopOrder.findUnique({
      where: { id: shopOrderId },
      include: { shop: true },
    });
    if (!shopOrder) throw new NotFoundException('Shop order not found');

    // Authorization check: User must be ADMIN, SHIPPER, or the Shop Owner
    if (user.role !== 'ADMIN' && user.role !== 'SHIPPER') {
      if (shopOrder.shop.owner_id !== user.id) {
        throw new ForbiddenException('You do not have permission to update tracking for this order');
      }
    }

    // Create the tracking event
    const event = await this.prisma.trackingEvent.create({
      data: {
        shop_order_id: shopOrderId,
        event_type: dto.event_type,
        location: dto.location,
        proof_image: dto.proof_image,
        shipper_id: user.role === 'SHIPPER' ? user.id : (dto.shipper_id || null),
      },
    });

    // Auto-update shop order status based on event type
    const statusMap: Record<string, string> = {
      order_packed: 'PREPARING',
      ready_for_pickup: 'READY_FOR_PICKUP',
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
      const customerId = fullOrder.parent_order.user_id;

      // Phát tracking event (chuỗi snake_case để khớp frontend)
      this.notifications.emitTrackingEvent(customerId, {
        id: event.id,
        shopOrderId: fullOrder.id,
        event_type: dto.event_type,
        location: dto.location,
        created_at: event.created_at,
      });

      // Phát order status changed nếu trạng thái có thay đổi
      if (newStatus) {
        this.notifications.emitOrderStatusChanged(customerId, {
          orderId: fullOrder.parent_order_id,
          shopOrderId: fullOrder.id,
          status: newStatus,
        });
      }
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

  async getActiveDeliveries(shipperId: string) {
    // Find all shop_order_ids this shipper has interacted with
    const events = await this.prisma.trackingEvent.findMany({
      where: { shipper_id: shipperId },
      select: { shop_order_id: true },
      distinct: ['shop_order_id'],
    });

    const shopOrderIds = events.map((e) => e.shop_order_id);

    // Fetch those shop orders if they are not delivered or cancelled
    return this.prisma.shopOrder.findMany({
      where: {
        id: { in: shopOrderIds },
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      include: {
        shop: {
          select: { name: true },
        },
        parent_order: {
          select: { shipping_address: true, user: { select: { full_name: true, phone: true } } },
        },
        order_items: {
          include: { product: { select: { name: true, images: true } } },
        },
        tracking_events: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }
}
