import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { ShipmentRepositoryPort } from '@shipment/application/ports/shipment.repository.port';
import { ShipmentStatus } from '@shipment/domain/enums/shipment-status.enum';
import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';
import { ShipmentEntity } from '@shipment/infra/entities/shipment.entity';

// Simulates a carrier delivery callback: shortly after dispatch, the carrier
// reports the parcel delivered. Marks DISPATCHED shipments DELIVERED → emits
// ShipmentDelivered (via the outbox) → the saga completes the order. Without
// this, the happy path would stall at SHIPPED until the saga times out.
@Injectable()
export class ShipmentDeliveryScheduler {
  private readonly logger = new Logger(ShipmentDeliveryScheduler.name);
  private isRunning = false;

  constructor(
    @InjectRepository(ShipmentEntity)
    private readonly shipments: Repository<ShipmentEntity>,
    private readonly shipmentRepository: ShipmentRepositoryPort,
  ) {}

  @Interval(1000)
  async deliverDispatched(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      const dispatched = await this.shipments.find({
        where: { status: ShipmentStatus.DISPATCHED },
      });
      for (const entity of dispatched) {
        try {
          await this.deliver(entity.id);
        } catch (error) {
          this.logger.error(
            `Delivery simulation failed for shipment ${entity.id}`,
            error as Error,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  @Transactional()
  private async deliver(shipmentId: string): Promise<void> {
    const shipment = await this.shipmentRepository.findById(
      ShipmentId.create(shipmentId),
    );
    if (!shipment) {
      return;
    }
    shipment.deliver();
    await this.shipmentRepository.save(shipment);
  }
}
