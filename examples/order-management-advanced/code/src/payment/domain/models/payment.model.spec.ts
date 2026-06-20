import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { PaymentFailedEvent } from '@payment/domain/events/payment-failed.event';
import { PaymentRequestedEvent } from '@payment/domain/events/payment-requested.event';
import { PaymentSucceededEvent } from '@payment/domain/events/payment-succeeded.event';
import { RefundIssuedEvent } from '@payment/domain/events/refund-issued.event';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';

const buildPayment = (orderId?: string) => {
  const id = orderId || crypto.randomUUID();

  return Payment.create(
    id,
    Money.create(100, 'USD'),
    PaymentMethod.BANK_TRANSFER,
  );
};

describe('Payment', () => {
  it('create a payment successfully', () => {
    const orderId = crypto.randomUUID();
    const payment = buildPayment(orderId);

    expect(payment.getOrderId()).toBe(orderId);
    expect(payment.getAmount()).toEqual(Money.create(100, 'USD'));

    const events = payment.pullEvents();
    expect(events.length).toBe(1);
    expect(events.at(-1)).toBeInstanceOf(PaymentRequestedEvent);
  });

  it('reconstitutes a payment successfully', () => {
    const orderId = crypto.randomUUID();

    const payment = buildPayment(orderId);

    const reconstitutedPayment = Payment.reconstitute(
      payment.getPaymentId(),
      payment.getOrderId(),
      payment.getAmount(),
      payment.getMethod(),
      payment.getPaymentStatus(),
      payment.getGatewayRef(),
    );

    expect(reconstitutedPayment.getOrderId()).toBe(orderId);
    expect(reconstitutedPayment.getAmount()).toEqual(Money.create(100, 'USD'));
    expect(reconstitutedPayment.getPaymentStatus()).toEqual(
      PaymentStatus.REQUESTED,
    );

    const events = reconstitutedPayment.pullEvents();
    expect(events.length).toBe(0);
  });

  it('makes the payment succeeded successfully', () => {
    const orderId = crypto.randomUUID();

    const payment = buildPayment(orderId);

    payment.succeed('gateway-ref');

    expect(payment.getPaymentStatus()).toEqual(PaymentStatus.SUCCEEDED);
    expect(payment.getGatewayRef()).toEqual('gateway-ref');

    const events = payment.pullEvents();
    expect(events.length).toBe(2);
    expect(events.at(-1)).toBeInstanceOf(PaymentSucceededEvent);
  });

  it('throws error when makes the payment succeeded but payment is not in requested state', () => {
    const payment = buildPayment();

    payment.succeed('gateway-ref');

    expect(() => payment.succeed('gateway-ref')).toThrow();
  });

  it('makes the payment refunded successfully', () => {
    const payment = buildPayment();

    payment.succeed('gateway-ref');
    payment.refund();

    expect(payment.getPaymentStatus()).toEqual(PaymentStatus.REFUNDED);

    const events = payment.pullEvents();

    expect(events.length).toBe(3);
    expect(events.at(-1)).toBeInstanceOf(RefundIssuedEvent);
  });

  it('throws error when makes the payment refunded but payment is not in succeeded state', () => {
    const payment = buildPayment();

    expect(() => payment.refund()).toThrow();
  });

  it('fails a payment successfully', () => {
    const payment = buildPayment();
    payment.fail();
    expect(payment.getPaymentStatus()).toBe(PaymentStatus.FAILED);
    const events = payment.pullEvents();
    expect(events.at(-1)).toBeInstanceOf(PaymentFailedEvent);
  });

  it('throws when failing a payment not in requested state', () => {
    const payment = buildPayment();
    payment.succeed('gateway-ref');
    expect(() => payment.fail()).toThrow(); // can't fail an already-succeeded payment
  });
});
