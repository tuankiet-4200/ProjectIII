import { OrdersProcessor } from './orders.processor';
import { Prisma } from '@prisma/client';

describe('OrdersProcessor', () => {
  const makePrisma = () => {
    const product = {
      id: 'product-1',
      name: 'Coffee',
      shop_id: 'shop-1',
      price: new Prisma.Decimal(120000),
    };

    const tx = {
      coupon: { findUnique: jest.fn() },
      parentOrder: { update: jest.fn() },
      shopOrder: {
        create: jest.fn().mockResolvedValue({ id: 'shop-order-1' }),
      },
      orderItem: { create: jest.fn() },
      product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };

    return {
      product: {
        findMany: jest.fn().mockResolvedValue([product]),
      },
      parentOrder: {
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: typeof tx) => unknown) =>
        callback(tx),
      ),
      tx,
    };
  };

  it('emits SePay checkout metadata with shipping and tax after processing a SePay order', async () => {
    const prisma = makePrisma();
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const notifications = { server: { to } };
    const sepayCheckout = {
      createPayment: jest.fn().mockReturnValue({
        provider: 'SEPAY',
        checkoutUrl: 'https://pay-sandbox.sepay.vn',
        fields: {
          merchant: 'merchant-1',
          operation: 'PURCHASE',
          payment_method: 'BANK_TRANSFER',
          order_invoice_number: 'parent-order-1',
          order_amount: 136200,
          currency: 'VND',
          signature: 'signed',
        },
      }),
    };

    const processor = new OrdersProcessor(
      prisma as any,
      notifications as any,
      sepayCheckout as any,
    );

    await processor.handleOrderCreate({
      userId: 'user-1',
      parentOrderId: 'parent-order-1',
      dto: {
        payment_method: 'SEPAY',
        shipping_address: 'Hanoi',
      },
      cartData: { 'product-1': '1' },
    });

    expect(sepayCheckout.createPayment).toHaveBeenCalledWith({
      orderId: 'parent-order-1',
      amount: 136200,
      description: 'Thanh toan don hang parent-order-1',
      customerId: 'user-1',
    });
    expect(emit).toHaveBeenCalledWith(
      'order_checkout_success',
      expect.objectContaining({
        parentOrderId: 'parent-order-1',
        paymentRequired: expect.objectContaining({
          provider: 'SEPAY',
          checkoutUrl: 'https://pay-sandbox.sepay.vn',
          fields: expect.objectContaining({
            order_invoice_number: 'parent-order-1',
            signature: 'signed',
          }),
        }),
      }),
    );
  });
});
