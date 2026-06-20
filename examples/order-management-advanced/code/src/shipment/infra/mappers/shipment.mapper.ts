import { ShipmentStatus } from '@shipment/domain/enums/shipment-status.enum';
import { Shipment } from '@shipment/domain/models/shipment.model';
import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';
import { ShipmentEntity } from '@shipment/infra/entities/shipment.entity';

export class ShipmentMapper {
  static toEntity(shipment: Shipment): ShipmentEntity {
    const entity = new ShipmentEntity();
    entity.id = shipment.getShipmentId().getValue();
    entity.orderId = shipment.getOrderId();
    entity.status = shipment.getShipmentStatus();
    entity.trackingCode = shipment.getTrackingCode()?.getValue() ?? null;
    return entity;
  }

  static toDomain(entity: ShipmentEntity): Shipment {
    return Shipment.reconstitute(
      ShipmentId.create(entity.id),
      entity.orderId,
      entity.status as ShipmentStatus,
      entity.trackingCode,
    );
  }
}
