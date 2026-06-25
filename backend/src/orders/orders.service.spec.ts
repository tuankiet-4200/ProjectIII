import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const makeService = (sepayOrder: any) => {
    const order = {
      id: 'parent-order-1',
      user_id: 'user-1',
      total_payment: new Prisma.Decimal(136200),
      payment_method: 'SEPAY',
      payment_status: 'UNPAID',
      shop_orders: [],
    };
    const prisma = {
      parentOrder: {
        findFirst: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockResolvedValue({ ...order, payment_status: 'PAID' }),
      },
    };
    const sepayCheckout = {
      retrieveOrder: jest.fn().mockResolvedValue(sepayOrder),
    };

    return {
      service: new OrdersService(
        prisma as any,
        {} as any,
        {} as any,
        {} as any,
        sepayCheckout as any,
      ),
      prisma,
      sepayCheckout,
    };
  };

  it('marks a SePay order as paid only after SePay reports a paid status and matching amount', async () => {
    const { service, prisma, sepayCheckout } = makeService({
      data: {
        order_status: 'COMPLETED',
        order_amount: 136200,
      },
    });

    await expect(
      service.confirmSepayPayment('user-1', 'parent-order-1'),
    ).resolves.toMatchObject({ payment_status: 'PAID' });

    expect(sepayCheckout.retrieveOrder).toHaveBeenCalledWith('parent-order-1');
    expect(prisma.parentOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'parent-order-1' },
        data: { payment_status: 'PAID' },
      }),
    );
  });

  it('does not mark the order as paid when SePay amount does not match', async () => {
    const { service, prisma } = makeService({
      data: {
        order_status: 'COMPLETED',
        order_amount: 1000,
      },
    });

    await expect(
      service.confirmSepayPayment('user-1', 'parent-order-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.parentOrder.update).not.toHaveBeenCalled();
  });
});
