import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';

describe('PaymentMapper', () => {
  it('round-trips a payment through entity and back', () => {
    const payment = Payment.create(
      'order-1',
      Money.create(200, 'USD'),
      PaymentMethod.CARD,
    );
    payment.succeed('gw-1');

    const restored = PaymentMapper.toDomain(PaymentMapper.toEntity(payment));

    expect(restored.getPaymentId().equals(payment.getPaymentId())).toBe(true);
    expect(restored.getOrderId()).toBe('order-1');
    expect(restored.getAmount().equals(Money.create(200, 'USD'))).toBe(true);
    expect(restored.getMethod()).toBe(PaymentMethod.CARD);
    expect(restored.getPaymentStatus()).toBe(PaymentStatus.SUCCEEDED);
    expect(restored.getGatewayRef()).toBe('gw-1');
  });
});
