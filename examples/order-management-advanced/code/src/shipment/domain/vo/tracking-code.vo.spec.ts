import { TrackingCode } from '@shipment/domain/vo/tracking-code.vo';

describe('TrackingCode', () => {
  it('creates a tracking code successfully', () => {
    const trackingCode = TrackingCode.create('123');

    expect(trackingCode).toBeInstanceOf(TrackingCode);
    expect(trackingCode.getValue()).toBe('123');
  });

  it('throws an error when creating a tracking code with an invalid value', () => {
    expect(() => TrackingCode.create('')).toThrow('Invalid tracking code');
  });

  it('equals another tracking code with the same value', () => {
    const trackingCode1 = TrackingCode.create('123');
    const trackingCode2 = TrackingCode.create('123');

    expect(trackingCode1.equals(trackingCode2)).toBe(true);
  });
});
