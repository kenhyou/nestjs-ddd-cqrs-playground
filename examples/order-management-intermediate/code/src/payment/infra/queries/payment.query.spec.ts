import { Money } from '@payment/domain/vo/money.vo';
import { Payment } from '@payment/domain/models/payment.model';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentQuery } from '@payment/infra/queries/payment.query';
import { DataSource } from 'typeorm';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { PaymentRepository } from '@payment/infra/repositories/payment.repository';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';

describe('PaymentQuery', () => {
  let dataSource: DataSource;
  let writeRepository: PaymentRepository;
  let query: PaymentQuery;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [PaymentEntity],
      synchronize: true,
    });

    await dataSource.initialize();
    writeRepository = new PaymentRepository(
      dataSource.getRepository(PaymentEntity),
      new PaymentMapper(),
    );
    query = new PaymentQuery(dataSource.getRepository(PaymentEntity));
  });

  afterEach(async () => {
    await dataSource.getRepository(PaymentEntity).clear();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('finds a payment by id', async () => {
    const payment = Payment.reconstitute(
      PaymentId.generate(),
      crypto.randomUUID(),
      Money.create(1000, 'KRW'),
      PaymentMethod.BANK_TRANSFER,
      PaymentStatus.SUCCEEDED,
    );
    await writeRepository.save(payment);

    const rm = await query.findById(payment.getPaymentId().getValue());

    expect(rm).not.toBeNull();
    expect(rm!.paymentId).toBe(payment.getPaymentId().getValue());
    expect(rm!.method).toBe(PaymentMethod.BANK_TRANSFER);
  });

  it('returns null when not found', async () => {
    const rm = await query.findById('missing');
    expect(rm).toBeNull();
  });

  it('finds a payment by order id', async () => {
    const payment = Payment.reconstitute(
      PaymentId.generate(),
      crypto.randomUUID(),
      Money.create(1000, 'KRW'),
      PaymentMethod.BANK_TRANSFER,
      PaymentStatus.SUCCEEDED,
    );
    await writeRepository.save(payment);

    const rm = await query.findByOrderId(payment.getOrderId());

    expect(rm).not.toBeNull();
    expect(rm!.paymentId).toBe(payment.getPaymentId().getValue());
    expect(rm!.method).toBe(PaymentMethod.BANK_TRANSFER);
  });

  it('returns null when order id not found', async () => {
    const rm = await query.findByOrderId('missing');
    expect(rm).toBeNull();
  });
});
