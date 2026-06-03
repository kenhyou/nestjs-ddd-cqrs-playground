import { DataSource } from 'typeorm';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OrderRepository } from '@order/infra/repositories/order.repository';

describe('OrderRepository (integration)', () => {
  let dataSource: DataSource;
  let repository: OrderRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    repository = new OrderRepository(
      dataSource.getRepository(OrderEntity),
      new OrderMapper(new OrderItemMapper()),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.getRepository(OrderItemEntity).clear();
    await dataSource.getRepository(OrderEntity).clear();
  });

  it('saves an order and loads it back with its items (eager)', async () => {
    const order = Order.create('c1', [
      OrderItem.create('A', Money.create(100, 'KRW'), 2),
      OrderItem.create('B', Money.create(200, 'KRW'), 1),
    ]);

    await repository.save(order);
    const found = await repository.findById(order.getOrderId());

    expect(found).not.toBeNull();
    expect(found!.getOrderId().getValue()).toBe(order.getOrderId().getValue());
    expect(found!.getCustomerId()).toBe('c1');
    expect(found!.getTotalPrice().getAmount()).toBe(400);
    expect(found!.getOrderItems()).toHaveLength(2);
  });

  it('returns null when the order is not found', async () => {
    const missing = Order.create('c2', [
      OrderItem.create('Z', Money.create(1, 'KRW'), 1),
    ]);
    const found = await repository.findById(missing.getOrderId());
    expect(found).toBeNull();
  });
});
