import { Money } from '@payment/domain/vo/money.vo';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { Payment } from '@payment/domain/models/payment.model';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';

describe('PaymentMapper', () => {
  let mapper: PaymentMapper;

  beforeEach(() => {
    mapper = new PaymentMapper();
  });

  describe('toOrm', () => {
    it('maps a Payment domain object to a PaymentEntity', () => {
      const paymentId = PaymentId.generate();
      const orderId = crypto.randomUUID();
      const domain = Payment.reconstitute(
        paymentId,
        orderId,
        Money.create(100, 'USD'),
        PaymentMethod.BANK_TRANSFER,
        PaymentStatus.SUCCEEDED,
      );

      const entity = mapper.toOrm(domain);

      expect(entity).toBeInstanceOf(PaymentEntity);
      expect(entity.paymentId).toBe(paymentId.getValue());
      expect(entity.orderId).toBe(orderId);
      expect(entity.amount).toBe(100);
      expect(entity.currency).toBe('USD');
      expect(entity.method).toBe(PaymentMethod.BANK_TRANSFER);
      expect(entity.status).toBe(PaymentStatus.SUCCEEDED);
    });
  });

  describe('toDomain', () => {
    it('maps a PaymentEntity to a Payment domain object', () => {
      const paymentId = PaymentId.generate();
      const orderId = crypto.randomUUID();
      const entity = new PaymentEntity();
      entity.paymentId = paymentId.getValue();
      entity.orderId = orderId;
      entity.amount = 100;
      entity.currency = 'USD';
      entity.method = PaymentMethod.BANK_TRANSFER;
      entity.status = PaymentStatus.SUCCEEDED;

      const domain = mapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Payment);
      expect(domain.getPaymentId().getValue()).toBe(paymentId.getValue());
      expect(domain.getOrderId()).toBe(orderId);
      expect(domain.getAmount().getAmount()).toBe(100);
      expect(domain.getAmount().getCurrency()).toBe('USD');
      expect(domain.getMethod()).toBe(PaymentMethod.BANK_TRANSFER);
      expect(domain.getPaymentStatus()).toBe(PaymentStatus.SUCCEEDED);
    });
  });
});
