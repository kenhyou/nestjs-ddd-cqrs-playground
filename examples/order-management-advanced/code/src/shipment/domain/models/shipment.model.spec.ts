import { Shipment } from '@shipment/domain/models/shipment.model';
import { ShipmentStatus } from '@shipment/domain/enums/shipment-status.enum';
import { ShipmentDispatchedEvent } from '@shipment/domain/events/shipment-dispatched.event';
import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';
import { ShipmentDeliveredEvent } from '@shipment/domain/events/shipment-delivered.event';
import { ShipmentFailedEvent } from '@shipment/domain/events/shipment-failed.event';

describe('Shipment', () => {
  it('creates a shipment successfully', () => {
    const orderId = crypto.randomUUID();
    const shipment = Shipment.create(orderId);

    expect(shipment).toBeInstanceOf(Shipment);
    expect(shipment.getOrderId()).toBe(orderId);
    expect(shipment.getTrackingCode()).toBe(null);
    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.PENDING);

    const events = shipment.pullEvents();
    expect(events).toHaveLength(0);
  });

  it('fails to create a shipment with an invalid order id', () => {
    const orderId = '';
    expect(() => Shipment.create(orderId)).toThrow();
  });

  it('successfully reconstitutes a shipment', () => {
    const orderId = crypto.randomUUID();
    const shipment = Shipment.reconstitute(
      ShipmentId.generate(),
      orderId,
      ShipmentStatus.PENDING,
    );

    expect(shipment).toBeInstanceOf(Shipment);
    expect(shipment.getOrderId()).toBe(orderId);
    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.PENDING);
  });

  it('fails to reconstitute a shipment with an invalid order id', () => {
    const orderId = '';
    expect(() =>
      Shipment.reconstitute(
        ShipmentId.generate(),
        orderId,
        ShipmentStatus.PENDING,
      ),
    ).toThrow();
  });

  it('dispatches a shipment successfully', () => {
    const orderId = crypto.randomUUID();
    const shipment = Shipment.create(orderId);
    const trackingCode = '123';

    shipment.dispatch(trackingCode);

    expect(shipment.getTrackingCode()?.getValue()).toBe(trackingCode);
    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.DISPATCHED);

    const events = shipment.pullEvents();
    expect(events).toHaveLength(1);
    expect(events.at(-1)).toBeInstanceOf(ShipmentDispatchedEvent);
    expect(events[0].payload()).toEqual({
      shipmentId: shipment.getShipmentId().getValue(),
      orderId: orderId,
      trackingCode,
    });
  });

  it('throws an error when dispatching a shipment with an empty tracking code', () => {
    const shipment = Shipment.create(crypto.randomUUID());

    expect(() => shipment.dispatch('')).toThrow();
    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.PENDING);
  });

  it('throws an error when dispatching a shipment that is already dispatched', () => {
    const shipment = Shipment.create(crypto.randomUUID());

    shipment.dispatch('123');

    expect(() => shipment.dispatch('456')).toThrow();
    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.DISPATCHED);
  });

  it('delivers a shipment successfully', () => {
    const shipment = Shipment.create(crypto.randomUUID());
    shipment.dispatch('123');
    shipment.deliver();

    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.DELIVERED);

    const events = shipment.pullEvents();
    expect(events).toHaveLength(2);
    expect(events.at(-1)).toBeInstanceOf(ShipmentDeliveredEvent);
  });

  it('throws an error when delivering a shipment that is not dispatched', () => {
    const shipment = Shipment.create(crypto.randomUUID());

    expect(() => shipment.deliver()).toThrow();
  });

  it('successfully fails a shipment', () => {
    const shipment = Shipment.create(crypto.randomUUID());

    shipment.fail();

    expect(shipment.getShipmentStatus()).toBe(ShipmentStatus.FAILED);

    const events = shipment.pullEvents();
    expect(events).toHaveLength(1);
    expect(events.at(-1)).toBeInstanceOf(ShipmentFailedEvent);
    expect(events[0].payload()).toEqual({
      shipmentId: shipment.getShipmentId().getValue(),
      orderId: shipment.getOrderId(),
    });
  });

  it('throws an error when failing a shipment that is not in pending state', () => {
    const shipment = Shipment.create(crypto.randomUUID());
    shipment.dispatch('123');

    expect(() => shipment.fail()).toThrow();
  });
});
