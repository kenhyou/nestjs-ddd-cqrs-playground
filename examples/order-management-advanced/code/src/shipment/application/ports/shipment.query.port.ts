import { ShipmentReadModel } from '@shipment/application/queries/dtos/shipment.read-model';

export abstract class ShipmentQueryPort {
  abstract findById(shipmentId: string): Promise<ShipmentReadModel | null>;
}
