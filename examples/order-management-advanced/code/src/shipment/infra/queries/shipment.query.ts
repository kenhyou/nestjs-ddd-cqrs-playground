import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentQueryPort } from '@shipment/application/ports/shipment.query.port';
import { ShipmentReadModel } from '@shipment/application/queries/dtos/shipment.read-model';
import { ShipmentEntity } from '@shipment/infra/entities/shipment.entity';

@Injectable()
export class ShipmentQuery implements ShipmentQueryPort {
  constructor(
    @InjectRepository(ShipmentEntity)
    private readonly shipments: Repository<ShipmentEntity>,
  ) {}

  async findById(shipmentId: string): Promise<ShipmentReadModel | null> {
    const entity = await this.shipments.findOne({ where: { id: shipmentId } });
    if (!entity) {
      return null;
    }
    return {
      id: entity.id,
      orderId: entity.orderId,
      status: entity.status,
      trackingCode: entity.trackingCode,
    };
  }
}
