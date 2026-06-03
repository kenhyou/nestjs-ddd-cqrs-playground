import { DataSource } from 'typeorm';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OrderQuery } from '@order/infra/queries/order.query';
import { OrderRepository } from '@order/infra/repositories/order.repository';

describe('OrderQuery (integration)', () => {
  let dataSource: DataSource;
  let writeRepository: OrderRepository;
  let query: OrderQuery;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    writeRepository = new OrderRepository(
      dataSource.getRepository(OrderEntity),
      new OrderMapper(new OrderItemMapper()),
    );
    query = new OrderQuery(dataSource.getRepository(OrderEntity));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.getRepository(OrderItemEntity).clear();
    await dataSource.getRepository(OrderEntity).clear();
  });

  it('projects the order directly into a Read Model (no domain reconstitution)', async () => {
    const order = Order.create('c1', [
      OrderItem.create('A', Money.create(100, 'KRW'), 2),
    ]);
    await writeRepository.save(order);

    const rm = await query.findById(order.getOrderId().getValue());

    expect(rm).toBeInstanceOf(OrderReadModel);
    expect(rm!.orderId).toBe(order.getOrderId().getValue());
    expect(rm!.customerId).toBe('c1');
    expect(rm!.status).toBe('PENDING');
    expect(rm!.totalAmount).toBe(200);
    expect(rm!.currency).toBe('KRW');
    expect(rm!.items).toHaveLength(1);
    expect(rm!.items[0].name).toBe('A');
  });

  it('returns null when the order is not found', async () => {
    const rm = await query.findById('missing');
    expect(rm).toBeNull();
  });
});
