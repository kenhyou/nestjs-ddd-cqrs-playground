import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OrderQuery } from '@order/infra/queries/order.query';
import { OrderRepository } from '@order/infra/repositories/order.repository';
import { DataSource } from 'typeorm';

describe('OrderQuery (integration)', () => {
  let dataSource: DataSource;
  let repository: OrderRepository;
  let query: OrderQuery;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    repository = new OrderRepository(
      dataSource.getRepository(OrderEntity),
      new OrderMapper(new OrderItemMapper()),
    );
    query = new OrderQuery(dataSource.getRepository(OrderEntity));
  });

  afterEach(async () => {
    await dataSource.getRepository(OrderItemEntity).clear();
    await dataSource.getRepository(OrderEntity).clear();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('projects a saved order into a read model', async () => {
    const order = new OrderFactory().create('c1', [
      {
        productId: 'p1',
        productName: 'P1',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);
    await repository.save(order);

    const rm = await query.findById(order.getOrderId().getValue());

    expect(rm).not.toBeNull();
    expect(rm?.customerId).toBe('c1');
    expect(rm?.items).toHaveLength(1);
    expect(rm?.totalAmount).toBe(2000);
  });

  it('returns null for a missing order', async () => {
    const rm = await query.findById('missing');
    expect(rm).toBeNull();
  });
});
