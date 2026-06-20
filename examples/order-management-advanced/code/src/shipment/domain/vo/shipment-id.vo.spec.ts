import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';

describe('ShipmentId', () => {
  it('creates a shipment id', () => {
    const shipmentId = ShipmentId.create(crypto.randomUUID());
    expect(shipmentId).toBeInstanceOf(ShipmentId);
  });

  it('reconstitutes a shipment id', () => {
    const shipmentId = ShipmentId.generate();
    expect(shipmentId).toBeInstanceOf(ShipmentId);
  });

  it('throws an error when creating with an invalid shipment id', () => {
    expect(() => ShipmentId.create('')).toThrow();
  });
});
