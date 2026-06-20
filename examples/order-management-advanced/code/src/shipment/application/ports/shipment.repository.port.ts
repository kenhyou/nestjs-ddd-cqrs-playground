import { Shipment } from '@shipment/domain/models/shipment.model';
import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';

export abstract class ShipmentRepositoryPort {
  abstract save(shipment: Shipment): Promise<void>;
  abstract findById(shipmentId: ShipmentId): Promise<Shipment | null>;
}
