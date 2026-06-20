import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ShipmentQueryPort } from '@shipment/application/ports/shipment.query.port';
import { ShipmentReadModel } from '@shipment/application/queries/dtos/shipment.read-model';
import { GetShipmentQuery } from '@shipment/application/queries/get-shipment.query';
import { ShipmentNotFoundException } from '@shipment/domain/exceptions/shipment.exceptions';

@QueryHandler(GetShipmentQuery)
export class GetShipmentQueryHandler
  implements IQueryHandler<GetShipmentQuery, ShipmentReadModel>
{
  constructor(private readonly shipmentQuery: ShipmentQueryPort) {}

  async execute(query: GetShipmentQuery): Promise<ShipmentReadModel> {
    const shipment = await this.shipmentQuery.findById(query.shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundException(query.shipmentId);
    }
    return shipment;
  }
}
