import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { OrdersModule } from './orders.module';
import { OrdersProcessor } from './orders.processor';

describe('OrdersModule', () => {
  it('registers OrdersProcessor as a controller so RabbitMQ event handlers are discovered', () => {
    const controllers =
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, OrdersModule) || [];

    expect(controllers).toContain(OrdersProcessor);
  });
});
