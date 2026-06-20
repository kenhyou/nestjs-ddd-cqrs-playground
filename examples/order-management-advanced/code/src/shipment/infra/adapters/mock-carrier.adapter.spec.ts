import { ConfigService } from '@nestjs/config';
import { MockCarrierAdapter } from '@shipment/infra/adapters/mock-carrier.adapter';

describe('MockCarrierAdapter (ACL)', () => {
  let adapter: MockCarrierAdapter;

  const config = (forceFail?: string) =>
    ({ get: () => forceFail }) as unknown as ConfigService;

  beforeEach(() => {
    adapter = new MockCarrierAdapter(config());
  });

  it('translates an accepted dispatch into a dispatched outcome with a tracking code', async () => {
    const outcome = await adapter.dispatch({ orderId: 'order-1' });

    expect(outcome.dispatched).toBe(true);
    expect(outcome.trackingCode).toMatch(/^WB-/);
  });

  it('translates a rejected dispatch (force-fail) into an undispatched outcome', async () => {
    adapter.forceFail = true;

    const outcome = await adapter.dispatch({ orderId: 'order-1' });

    expect(outcome.dispatched).toBe(false);
    expect(outcome.trackingCode).toBe('');
  });

  it('reads the force-fail flag from config (CARRIER_FORCE_FAIL=true)', async () => {
    const fromConfig = new MockCarrierAdapter(config('true'));

    const outcome = await fromConfig.dispatch({ orderId: 'order-1' });

    expect(outcome.dispatched).toBe(false);
  });
});
