import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderRepository } from '@order/infra/repositories/order.repository';
import { PaymentRepository } from '@payment/infra/repositories/payment.repository';
import { DataSource } from 'typeorm';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';
import { PaymentCommandAdapter } from '@order/infra/adapters/payment-command.adapter';

describe('ConfirmOrderCommandHandler transaction (integration)', () => {
  let dataSource: DataSource;
  let orderRepo: OrderRepository;
  let paymentRepo: PaymentRepository;

  beforeAll(async () => {
    initializeTransactionalContext();
    dataSource = addTransactionalDataSource(
      new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: [OrderEntity, OrderItemEntity, PaymentEntity],
        synchronize: true,
      }),
    );
    await dataSource.initialize();
    orderRepo = new OrderRepository(
      dataSource.getRepository(OrderEntity),
      new OrderMapper(new OrderItemMapper()),
    );
    paymentRepo = new PaymentRepository(
      dataSource.getRepository(PaymentEntity),
      new PaymentMapper(),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });
  afterEach(async () => {
    await dataSource.getRepository(PaymentEntity).clear();
    await dataSource.getRepository(OrderItemEntity).clear();
    await dataSource.getRepository(OrderEntity).clear();
  });

  const pendingOrder = async () => {
    const order = new OrderFactory().create('c1', [
      {
        productId: 'p1',
        productName: 'P',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);
    await orderRepo.save(order);
    return order;
  };

  it('commits order confirm + payment together (happy path, D1)', async () => {
    const order = await pendingOrder();
    const handler = new ConfirmOrderCommandHandler(
      orderRepo,
      new PaymentCommandAdapter(paymentRepo),
    ); // REAL adapter → succeeds

    await handler.execute(
      new ConfirmOrderCommand(order.getOrderId().getValue(), 'CARD'),
    );

    const reloaded = await orderRepo.findById(order.getOrderId());
    expect(reloaded!.getOrderStatus()).toBe(OrderStatus.CONFIRMED);
    const payment = await dataSource
      .getRepository(PaymentEntity)
      .findOne({ where: { orderId: order.getOrderId().getValue() } });
    expect(payment).not.toBeNull(); // both committed
  });

  it('rolls back the confirm when payment creation fails (D1)', async () => {
    const order = await pendingOrder();
    const failingPort = {
      createPayment: jest.fn().mockRejectedValue(new Error('payment failed')),
    };
    const handler = new ConfirmOrderCommandHandler(
      orderRepo,
      failingPort as any,
    );

    await expect(
      handler.execute(
        new ConfirmOrderCommand(order.getOrderId().getValue(), 'CARD'),
      ),
    ).rejects.toThrow();

    const reloaded = await orderRepo.findById(order.getOrderId());
    expect(reloaded!.getOrderStatus()).toBe(OrderStatus.PENDING); // rolled back
    const payment = await dataSource
      .getRepository(PaymentEntity)
      .findOne({ where: { orderId: order.getOrderId().getValue() } });
    expect(payment).toBeNull(); // nothing persisted
  });

  it('throws when the order is not found', async () => {
    const handler = new ConfirmOrderCommandHandler(orderRepo, {
      createPayment: jest.fn(),
    } as any);
    await expect(
      handler.execute(new ConfirmOrderCommand('missing', 'CARD')),
    ).rejects.toThrow();
  });
});
