import { PaymentMethod } from '../enums/payment-method.enum';
import { Money } from '../vo/money.vo';
import { Payment } from './payment.model';
import { PaymentStatus } from '../enums/payment-status.enum';

describe('Payment', () => {
  it('should create Payment with valid arguments', () => {
    const payment = Payment.create(
      '123e4567-e89b-12d3-a456-426614174000',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );
    expect(payment).toBeInstanceOf(Payment);
    expect(payment.getAmount().getAmount()).toBe(1000);
    expect(payment.getMethod()).toBe(PaymentMethod.CARD);
    expect(payment.getPaymentStatus()).toBe(PaymentStatus.REQUESTED);
  });

  it('should succeed payment', () => {
    const payment = Payment.create(
      '123e4567-e89b-12d3-a456-426614174000',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );
    payment.succeed();
    expect(payment.getPaymentStatus()).toBe(PaymentStatus.SUCCEEDED);
  });

  it('should fail payment', () => {
    const payment = Payment.create(
      '123e4567-e89b-12d3-a456-426614174000',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );
    payment.fail();
    expect(payment.getPaymentStatus()).toBe(PaymentStatus.FAILED);
  });

  it('cannot refund a payment that has not succeeded', () => {
    const payment = Payment.create(
      '123e4567-e89b-12d3-a456-426614174000',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );
    expect(() => payment.refund()).toThrow();
  });

  it('refunds a succeeded payment', () => {
    const payment = Payment.create(
      '123e4567-e89b-12d3-a456-426614174000',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );
    payment.succeed();
    payment.refund();
    expect(payment.getPaymentStatus()).toBe(PaymentStatus.REFUNDED);
  });
});
