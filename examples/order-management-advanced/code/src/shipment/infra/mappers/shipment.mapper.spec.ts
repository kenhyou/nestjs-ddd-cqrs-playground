import { ShipmentStatus } from '@shipment/domain/enums/shipment-status.enum';
import { Shipment } from '@shipment/domain/models/shipment.model';
import { ShipmentMapper } from '@shipment/infra/mappers/shipment.mapper';

describe('ShipmentMapper', () => {
  it('writes the tracking code to the entity', () => {
    const shipment = Shipment.create('order-1');
    shipment.dispatch('TRACK-1');

    const entity = ShipmentMapper.toEntity(shipment);

    expect(entity.status).toBe(ShipmentStatus.DISPATCHED);
    expect(entity.trackingCode).toBe('TRACK-1');
  });

  it('round-trips id/orderId/status/trackingCode', () => {
    const shipment = Shipment.create('order-1');
    shipment.dispatch('TRACK-1');

    const restored = ShipmentMapper.toDomain(ShipmentMapper.toEntity(shipment));

    expect(restored.getShipmentId().equals(shipment.getShipmentId())).toBe(true);
    expect(restored.getOrderId()).toBe('order-1');
    expect(restored.getShipmentStatus()).toBe(ShipmentStatus.DISPATCHED);
    expect(restored.getTrackingCode()?.getValue()).toBe('TRACK-1');
  });

  it('restores a null tracking code for a pending shipment', () => {
    const shipment = Shipment.create('order-1');

    const restored = ShipmentMapper.toDomain(ShipmentMapper.toEntity(shipment));

    expect(restored.getTrackingCode()).toBeNull();
  });
});
