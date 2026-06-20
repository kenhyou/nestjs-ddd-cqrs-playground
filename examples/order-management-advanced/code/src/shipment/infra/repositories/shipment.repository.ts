import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import { ShipmentRepositoryPort } from '@shipment/application/ports/shipment.repository.port';
import { Shipment } from '@shipment/domain/models/shipment.model';
import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';
import { ShipmentEntity } from '@shipment/infra/entities/shipment.entity';
import { ShipmentMapper } from '@shipment/infra/mappers/shipment.mapper';

@Injectable()
export class ShipmentRepository implements ShipmentRepositoryPort {
  constructor(
    @InjectRepository(ShipmentEntity)
    private readonly shipments: Repository<ShipmentEntity>,
    private readonly outbox: OutboxRepository,
  ) {}

  @Transactional()
  async save(shipment: Shipment): Promise<void> {
    const events = shipment.pullEvents();
    await this.shipments.save(ShipmentMapper.toEntity(shipment));
    await this.outbox.append(
      'shipment',
      shipment.getShipmentId().getValue(),
      events,
    );
  }

  async findById(shipmentId: ShipmentId): Promise<Shipment | null> {
    const entity = await this.shipments.findOne({
      where: { id: shipmentId.getValue() },
    });
    return entity ? ShipmentMapper.toDomain(entity) : null;
  }
}
