import { PaymentStatusQueryAdapter } from '@order/infra/adapters/payment-status-query.adapter';

describe('PaymentStatusQueryAdapter', () => {
  let paymentQuery: { findById: jest.Mock; findByOrderId: jest.Mock };
  let adapter: PaymentStatusQueryAdapter;

  beforeEach(() => {
    paymentQuery = { findById: jest.fn(), findByOrderId: jest.fn() };
    adapter = new PaymentStatusQueryAdapter(paymentQuery);
  });

  it('isPaid returns true when payment status is SUCCEEDED', async () => {
    paymentQuery.findByOrderId.mockResolvedValue({
      paymentId: '1',
      orderId: '1',
      amount: 1000,
      currency: 'KRW',
      method: 'CARD',
      status: 'SUCCEEDED',
    });

    const result = await adapter.isPaid('1');
    expect(result).toBe(true);
  });
});
