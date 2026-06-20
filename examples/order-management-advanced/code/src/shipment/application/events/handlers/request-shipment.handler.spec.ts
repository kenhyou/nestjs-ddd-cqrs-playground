import { CarrierPort } from '@shipment/application/ports/carrier.port';
import { ShipmentRepositoryPort } from '@shipment/application/ports/shipment.repository.port';
import { RequestShipmentHandler } from '@shipment/application/events/handlers/request-shipment.handler';
import { ShipmentStatus } from '@shipment/domain/enums/shipment-status.enum';
import { ShipmentDispatchedEvent } from '@shipment/domain/events/shipment-dispatched.event';
import { ShipmentFailedEvent } from '@shipment/domain/events/shipment-failed.event';

describe('RequestShipmentHandler', () => {
  let handler: RequestShipmentHandler;
  let shipmentRepository: jest.Mocked<ShipmentRepositoryPort>;
  let carrier: jest.Mocked<CarrierPort>;

  beforeEach(() => {
    shipmentRepository = { save: jest.fn(), findById: jest.fn() };
    carrier = { dispatch: jest.fn() };
    handler = new RequestShipmentHandler(shipmentRepository, carrier);
  });

  const message = () => ({
    messageId: 'msg-1',
    messageType: 'RequestShipment',
    payload: { orderId: 'order-1' },
  });

  it('dispatches the shipment when the carrier accepts', async () => {
    carrier.dispatch.mockResolvedValue({
      dispatched: true,
      trackingCode: 'TRACK-1',
    });

    await handler.handle(message());

    expect(shipmentRepository.save).toHaveBeenCalledTimes(1);
    const saved = shipmentRepository.save.mock.calls[0][0];
    expect(saved.getShipmentStatus()).toBe(ShipmentStatus.DISPATCHED);
    expect(saved.getTrackingCode()?.getValue()).toBe('TRACK-1');
    expect(saved.pullEvents().at(-1)).toBeInstanceOf(ShipmentDispatchedEvent);
  });

  it('fails the shipment when the carrier rejects', async () => {
    carrier.dispatch.mockResolvedValue({ dispatched: false, trackingCode: '' });

    await handler.handle(message());

    const saved = shipmentRepository.save.mock.calls[0][0];
    expect(saved.getShipmentStatus()).toBe(ShipmentStatus.FAILED);
    expect(saved.pullEvents().at(-1)).toBeInstanceOf(ShipmentFailedEvent);
  });
});
