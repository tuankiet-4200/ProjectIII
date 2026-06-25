import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Prisma, ShopOrder } from '@prisma/client';
import { SepayCheckoutService } from './sepay-checkout.service';
import { calculateOrderTotals } from './order-totals';

@Controller()
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private sepayCheckout: SepayCheckoutService,
  ) {}

  @EventPattern('order.create')
  async handleOrderCreate(@Payload() data: any) {
    this.logger.log(`Received order.create event for parentOrder: ${data.parentOrderId}`);
    const { userId, parentOrderId, dto, cartData } = data;

    try {
      const productIds = Object.keys(cartData);
      
      // Fetch products
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { shop: true },
      });

      // Group items by shop_id
      const shopGroups = new Map<
        string,
        { shopId: string; items: { product: (typeof products)[0]; quantity: number }[] }
      >();

      for (const product of products) {
        const quantity = parseInt(cartData[product.id], 10);
        if (!shopGroups.has(product.shop_id)) {
          shopGroups.set(product.shop_id, {
            shopId: product.shop_id,
            items: [],
          });
        }
        shopGroups.get(product.shop_id)!.items.push({ product, quantity });
      }

      // Calculate total payment
      let totalPayment = new Prisma.Decimal(0);
      for (const group of shopGroups.values()) {
        for (const item of group.items) {
          totalPayment = totalPayment.add(
            new Prisma.Decimal(item.product.price.toString()).mul(item.quantity),
          );
        }
      }

      // Perform the massive transaction
      const result = await this.prisma.$transaction(async (tx) => {
        let discountAmount = 0;
        let appliedCouponCode: string | null = null;
        const couponCode = dto.coupon_code?.trim();

        if (couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: couponCode.toUpperCase() },
          });

          if (coupon && coupon.is_active && (!coupon.expires_at || coupon.expires_at >= new Date())) {
            let applicableAmount = totalPayment.toNumber();
            if (coupon.shop_id) {
              const shopGroup = shopGroups.get(coupon.shop_id);
              if (shopGroup) {
                applicableAmount = shopGroup.items.reduce((s, item) => s + Number(item.product.price) * item.quantity, 0);
              } else {
                applicableAmount = 0;
              }
            }

            if (!coupon.min_order_amount || applicableAmount >= Number(coupon.min_order_amount)) {
              if (coupon.type === 'PERCENTAGE') {
                discountAmount = (applicableAmount * Number(coupon.value)) / 100;
                if (coupon.max_discount) discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
              } else {
                discountAmount = Math.min(Number(coupon.value), applicableAmount);
              }
              discountAmount = Math.round(discountAmount);
              appliedCouponCode = coupon.code;

              // Record usage
              await tx.coupon.update({
                where: { code: coupon.code },
                data: { used_count: { increment: 1 } },
              });
              await tx.couponUsage.create({
                data: { coupon_id: coupon.id, user_id: userId }
              });
            }
          }
        }

        const totals = calculateOrderTotals(
          totalPayment.toNumber(),
          discountAmount,
        );
        const finalTotalPayment = new Prisma.Decimal(totals.total);

        // Update the pending parent order with the final calculated total
        await tx.parentOrder.update({
          where: { id: parentOrderId },
          data: { total_payment: finalTotalPayment }
        });

        // Decrement stock and create orders
        const shopOrders: ShopOrder[] = [];

        let isFirstShopOrder = true;
        for (const group of shopGroups.values()) {
          const shopOrder = await tx.shopOrder.create({
            data: {
              parent_order_id: parentOrderId,
              shop_id: group.shopId,
              shipping_fee: isFirstShopOrder ? totals.shipping : 0,
            },
          });
          isFirstShopOrder = false;

          for (const item of group.items) {
            await tx.orderItem.create({
              data: {
                shop_order_id: shopOrder.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price_at_purchase: item.product.price,
              },
            });

            const updated = await tx.product.updateMany({
              where: {
                id: item.product.id,
                stock_quantity: { gte: item.quantity },
              },
              data: {
                stock_quantity: { decrement: item.quantity },
                sales_count: { increment: item.quantity },
              },
            });

            if (updated.count === 0) {
              throw new Error(`Sản phẩm "${item.product.name}" đã hết hàng.`);
            }
          }
          shopOrders.push(shopOrder);
        }

        return { finalTotalPayment, shopOrders };
      });

      this.logger.log(`Successfully processed parentOrder ${parentOrderId}`);
      
      const paymentRequired =
        dto.payment_method === 'SEPAY'
          ? this.sepayCheckout.createPayment({
              orderId: parentOrderId,
              amount: result.finalTotalPayment.toNumber(),
              description: `Thanh toan don hang ${parentOrderId}`,
              customerId: userId,
            })
          : undefined;

      // Notify Frontend via Socket
      this.notifications.server.to(`user_${userId}`).emit('order_checkout_success', {
        parentOrderId,
        message: 'Đơn hàng của bạn đã được xử lý thành công!',
        totalPayment: result.finalTotalPayment,
        status: 'COMPLETED',
        paymentRequired,
      });

    } catch (error) {
      this.logger.error(`Failed to process parentOrder ${parentOrderId}: ${error.message}`);
      
      // Delete the pending parent order since it failed
      await this.prisma.parentOrder.delete({ where: { id: parentOrderId } }).catch(() => {});

      // Notify Frontend via Socket about failure
      this.notifications.server.to(`user_${userId}`).emit('order_checkout_failed', {
        parentOrderId,
        message: error.message || 'Xử lý đơn hàng thất bại do lỗi hệ thống hoặc hết hàng.',
        status: 'FAILED'
      });
    }
  }
}
