import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { FulfillmentSagaEntity } from '@order/infra/entities/fulfillment-saga.entity';
import { SagaRepository } from '@order/infra/repositories/saga.repository';
import { SagaTimeoutScheduler } from '@order/infra/scheduler/saga-timeout.scheduler';
import { OutboxEventEntity } from '@outbox/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '@outbox/entities/processed-message.entity';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';

const PAST = new Date(Date.now() - 60_000);
const FUTURE = new Date(Date.now() + 60_000);

describe('SagaTimeoutScheduler (integration, SQLite)', () => {
  let dataSource: DataSource;
  let outbox: OutboxRepository;
  let sagaRepository: SagaRepository;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;
  let scheduler: SagaTimeoutScheduler;

  const seed = (
    status: SagaStatus,
    paymentId: string | null,
    awaitingUntil: Date | null,
  ): Promise<void> =>
    sagaRepository.save(
      FulfillmentSaga.reconstitute(
        OrderId.generate(),
        status,
        paymentId,
        null,
        awaitingUntil,
      ),
    );

  beforeAll(async () => {
    initializeTransactionalContext();
    dataSource = addTransactionalDataSource(
      new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: [
          FulfillmentSagaEntity,
          OutboxEventEntity,
          ProcessedMessageEntity,
        ],
        synchronize: true,
      }),
    );
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
    deleteDataSourceByName('default');
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    const sagaEntities = dataSource.getRepository(FulfillmentSagaEntity);
    outbox = new OutboxRepository(
      dataSource.getRepository(OutboxEventEntity),
      dataSource.getRepository(ProcessedMessageEntity),
    );
    sagaRepository = new SagaRepository(sagaEntities, outbox);
    orderRepository = { findById: jest.fn().mockResolvedValue(null), save: jest.fn() };
    scheduler = new SagaTimeoutScheduler(
      sagaEntities,
      sagaRepository,
      orderRepository,
    );
  });

  it('cancels a payment-awaiting saga past its deadline', async () => {
    const orderId = OrderId.generate();
    await sagaRepository.save(
      FulfillmentSaga.reconstitute(
        orderId,
        SagaStatus.AWAITING_PAYMENT,
        null,
        null,
        PAST,
      ),
    );

    await scheduler.checkTimeouts();

    const saga = await sagaRepository.findByOrderId(orderId);
    expect(saga?.getSagaStatus()).toBe(SagaStatus.CANCELLED);
  });

  it('compensates a shipment-awaiting saga past its deadline (refund row in outbox)', async () => {
    const orderId = OrderId.generate();
    await sagaRepository.save(
      FulfillmentSaga.reconstitute(
        orderId,
        SagaStatus.AWAITING_SHIPMENT,
        'pay-1',
        null,
        PAST,
      ),
    );

    await scheduler.checkTimeouts();

    const saga = await sagaRepository.findByOrderId(orderId);
    expect(saga?.getSagaStatus()).toBe(SagaStatus.COMPENSATING);
    const types = (await outbox.findUnpublished(10)).map((r) => r.messageType);
    expect(types).toContain('RequestRefund');
  });

  it('leaves a saga whose deadline has not passed untouched', async () => {
    const orderId = OrderId.generate();
    await sagaRepository.save(
      FulfillmentSaga.reconstitute(
        orderId,
        SagaStatus.AWAITING_PAYMENT,
        null,
        null,
        FUTURE,
      ),
    );

    await scheduler.checkTimeouts();

    const saga = await sagaRepository.findByOrderId(orderId);
    expect(saga?.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);
  });

  it('ignores non-awaiting sagas even if awaitingUntil is stale', async () => {
    // COMPLETED with a stale deadline must not be re-touched.
    await seed(SagaStatus.COMPLETED, 'pay-1', PAST);

    await scheduler.checkTimeouts();

    expect(await outbox.findUnpublished(10)).toHaveLength(0);
  });

  it('cancels the Order when a payment-awaiting saga times out (direct cancel)', async () => {
    const orderId = OrderId.generate();
    await sagaRepository.save(
      FulfillmentSaga.reconstitute(
        orderId,
        SagaStatus.AWAITING_PAYMENT,
        null,
        null,
        PAST,
      ),
    );
    const order = Order.reconstitute(
      orderId,
      'cust-1',
      OrderStatus.CONFIRMED,
      Money.create(100, 'USD'),
      [],
    );
    orderRepository.findById.mockResolvedValue(order);

    await scheduler.checkTimeouts();

    expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
  });
});
