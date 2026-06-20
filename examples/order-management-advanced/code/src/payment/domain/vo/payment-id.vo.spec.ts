import { PaymentId } from '@payment/domain/vo/payment-id.vo';

describe('PaymentId', () => {
  it('creates a payment id successfuly', () => {
    const id = crypto.randomUUID();
    const paymentId = PaymentId.create(id);

    expect(paymentId.getValue()).toBe(id);
  });

  it('throws error when creating payment id with invalid id', () => {
    const id = 'invalid-id';

    expect(() => PaymentId.create(id)).toThrow();
  });
});
