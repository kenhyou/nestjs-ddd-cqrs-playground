import { PaymentId } from '@payment/domain/vo/payment-id.vo';

describe('PaymentId', () => {
  it('should create PaymentId with valid arguments', () => {
    const id = PaymentId.create('123e4567-e89b-12d3-a456-426614174000');
    expect(id.getValue()).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw error when id is not a valid UUID', () => {
    expect(() => PaymentId.create('invalid-UUID')).toThrow(
      'id must be a valid uuid',
    );
  });
});
