import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OrderRepository } from '@order/infra/repositories/order.repository';
import { DataSource } from 'typeorm';

describe('OrderRepository (integration)', () => {
  let dataSource: DataSource;
  let repository: OrderRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    const repo = dataSource.getRepository(OrderEntity);
    const mapper = new OrderMapper(new OrderItemMapper());
    repository = new OrderRepository(repo, mapper);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.getRepository(OrderItemEntity).clear();
    await dataSource.getRepository(OrderEntity).clear();
  });

  it('saves an order and finds it back with its items', async () => {
    const order = new OrderFactory().create('c1', [
      {
        productId: 'p1',
        productName: 'P',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);
    await repository.save(order);

    const found = await repository.findById(order.getOrderId());
    expect(found).not.toBeNull();
    expect(found!.getCustomerId()).toBe('c1');
    expect(found!.getOrderItems()).toHaveLength(1);
    expect(found!.getTotalPrice().getAmount()).toBe(2000);
  });

  it('returns null for a missing order', async () => {
    const found = await repository.findById(OrderId.generate());
    expect(found).toBeNull();
  });
});
