import { Money } from '@payment/domain/vo/money.vo';
import { Payment } from '@payment/domain/models/payment.model';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';
import { PaymentRepository } from '@payment/infra/repositories/payment.repository';
import { DataSource } from 'typeorm';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';

describe('PaymentRepository', () => {
  let dataSource: DataSource;
  let repository: PaymentRepository;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [PaymentEntity],
      synchronize: true,
    });

    await dataSource.initialize();
    repository = new PaymentRepository(
      dataSource.getRepository(PaymentEntity),
      new PaymentMapper(),
    );
  });

  afterEach(async () => {
    await dataSource.getRepository(PaymentEntity).clear();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('saves a payment entity', async () => {
    const paymentId = PaymentId.generate();
    const orderId = crypto.randomUUID();
    const payment = Payment.reconstitute(
      paymentId,
      orderId,
      Money.create(1000, 'KRW'),
      PaymentMethod.BANK_TRANSFER,
      PaymentStatus.SUCCEEDED,
    );

    await repository.save(payment);

    const entity = await dataSource
      .getRepository(PaymentEntity)
      .findOne({ where: { paymentId: paymentId.getValue() } });
    expect(entity).not.toBeNull();
    expect(entity!.orderId).toBe(orderId);
    expect(entity!.amount).toBe(1000);
    expect(entity!.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('returns the payment when found', async () => {
    const orderId = crypto.randomUUID();
    const paymentId = PaymentId.generate();
    const payment = Payment.reconstitute(
      paymentId,
      orderId,
      Money.create(1000, 'KRW'),
      PaymentMethod.BANK_TRANSFER,
      PaymentStatus.SUCCEEDED,
    );

    await repository.save(payment);

    const result = await repository.findById(paymentId);
    expect(result).not.toBeNull();
    expect(result!.getOrderId()).toBe(orderId);
    expect(result!.getPaymentId().getValue()).toBe(paymentId.getValue());
  });

  it('returns null when not found', async () => {
    const result = await repository.findById(PaymentId.generate());
    expect(result).toBeNull();
  });
});
