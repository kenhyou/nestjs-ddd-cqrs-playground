import {
  FORCE_FAIL_AMOUNT,
  MockPaymentGatewayAdapter,
} from '@payment/infra/adapters/mock-payment-gateway.adapter';

describe('MockPaymentGatewayAdapter (ACL)', () => {
  let adapter: MockPaymentGatewayAdapter;

  beforeEach(() => {
    adapter = new MockPaymentGatewayAdapter();
  });

  it('translates an approved charge into a settled outcome', async () => {
    const outcome = await adapter.charge({
      orderId: 'order-1',
      amount: 200,
      currency: 'USD',
    });

    expect(outcome.settled).toBe(true);
    expect(outcome.gatewayRef).toMatch(/^gw_/);
  });

  it('translates the force-fail sentinel amount into an unsettled outcome', async () => {
    const outcome = await adapter.charge({
      orderId: 'order-1',
      amount: FORCE_FAIL_AMOUNT,
      currency: 'USD',
    });

    expect(outcome.settled).toBe(false);
  });

  it('translates a refund into a refunded outcome', async () => {
    const outcome = await adapter.refund({ gatewayRef: 'gw_abc' });

    expect(outcome.refunded).toBe(true);
  });
});
