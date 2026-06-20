import { ShipmentReadModel } from '@shipment/application/queries/dtos/shipment.read-model';
import { GetShipmentQuery } from '@shipment/application/queries/get-shipment.query';
import { GetShipmentQueryHandler } from '@shipment/application/queries/handlers/get-shipment.query.handler';

describe('GetShipmentQueryHandler', () => {
  let handler: GetShipmentQueryHandler;
  let shipmentQuery: { findById: jest.Mock };

  beforeEach(() => {
    shipmentQuery = { findById: jest.fn() };
    handler = new GetShipmentQueryHandler(shipmentQuery);
  });

  it('returns the read model directly from the query port', async () => {
    const readModel: ShipmentReadModel = {
      id: 'ship-1',
      orderId: 'order-1',
      status: 'DISPATCHED',
      trackingCode: 'TRACK-1',
    };
    shipmentQuery.findById.mockResolvedValue(readModel);

    const result = await handler.execute(new GetShipmentQuery('ship-1'));

    expect(shipmentQuery.findById).toHaveBeenCalledWith('ship-1');
    expect(result).toBe(readModel);
  });

  it('throws an error if the shipment is not found', async () => {
    shipmentQuery.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetShipmentQuery('ship-1')),
    ).rejects.toThrow('Shipment not found: ship-1');
  });
});
