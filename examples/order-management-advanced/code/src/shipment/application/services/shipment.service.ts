import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ShipmentReadModel } from '@shipment/application/queries/dtos/shipment.read-model';
import { GetShipmentQuery } from '@shipment/application/queries/get-shipment.query';

@Injectable()
export class ShipmentService {
  constructor(private readonly queryBus: QueryBus) {}

  getShipment(shipmentId: string): Promise<ShipmentReadModel> {
    return this.queryBus.execute(new GetShipmentQuery(shipmentId));
  }
}
