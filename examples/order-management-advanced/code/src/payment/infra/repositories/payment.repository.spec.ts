import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { OutboxEventEntity } from '@outbox/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '@outbox/entities/processed-message.entity';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentRepository } from '@payment/infra/repositories/payment.repository';

describe('PaymentRepository (integration, outbox atomicity)', () => {
  let dataSource: DataSource;
  let outbox: OutboxRepository;
  let repository: PaymentRepository;

  beforeAll(async () => {
    initializeTransactionalContext();
    dataSource = addTransactionalDataSource(
      new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: [PaymentEntity, OutboxEventEntity, ProcessedMessageEntity],
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
    outbox = new OutboxRepository(
      dataSource.getRepository(OutboxEventEntity),
      dataSource.getRepository(ProcessedMessageEntity),
    );
    repository = new PaymentRepository(
      dataSource.getRepository(PaymentEntity),
      outbox,
    );
  });

  it('writes the aggregate and its outbox row in the same save', async () => {
    const payment = Payment.create(
      'order-1',
      Money.create(200, 'USD'),
      PaymentMethod.CARD,
    );

    await repository.save(payment);

    expect(await repository.findById(payment.getPaymentId())).not.toBeNull();

    const rows = await outbox.findUnpublished(10);
    expect(rows).toHaveLength(1);
    expect(rows[0].messageType).toBe('PaymentRequested');
    expect(rows[0].aggregateType).toBe('payment');
    expect(rows[0].aggregateId).toBe(payment.getPaymentId().getValue());
  });

  it('persists a status change and appends a new outbox row', async () => {
    const payment = Payment.create(
      'order-1',
      Money.create(200, 'USD'),
      PaymentMethod.CARD,
    );
    await repository.save(payment); // PaymentRequested

    const loaded = await repository.findById(payment.getPaymentId());
    loaded!.succeed('gw-1');
    await repository.save(loaded!); // PaymentSucceeded

    const reloaded = await repository.findById(payment.getPaymentId());
    expect(reloaded!.getPaymentStatus()).toBe(PaymentStatus.SUCCEEDED);
    expect(reloaded!.getGatewayRef()).toBe('gw-1');

    const types = (await outbox.findUnpublished(10)).map((r) => r.messageType);
    expect(types).toEqual(
      expect.arrayContaining(['PaymentRequested', 'PaymentSucceeded']),
    );
  });
});
