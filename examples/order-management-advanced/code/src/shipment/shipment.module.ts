import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxModule } from '@outbox/outbox.module';
import { CarrierPort } from '@shipment/application/ports/carrier.port';
import { ShipmentQueryPort } from '@shipment/application/ports/shipment.query.port';
import { ShipmentRepositoryPort } from '@shipment/application/ports/shipment.repository.port';
import { RequestShipmentHandler } from '@shipment/application/events/handlers/request-shipment.handler';
import { GetShipmentQueryHandler } from '@shipment/application/queries/handlers/get-shipment.query.handler';
import { ShipmentService } from '@shipment/application/services/shipment.service';
import { MockCarrierAdapter } from '@shipment/infra/adapters/mock-carrier.adapter';
import { ShipmentEntity } from '@shipment/infra/entities/shipment.entity';
import { ShipmentQuery } from '@shipment/infra/queries/shipment.query';
import { ShipmentRepository } from '@shipment/infra/repositories/shipment.repository';
import { ShipmentDeliveryScheduler } from '@shipment/infra/scheduler/shipment-delivery.scheduler';
import { ShipmentController } from '@shipment/presenters/http/controllers/shipment.controller';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ShipmentEntity]),
    OutboxModule,
  ],
  controllers: [ShipmentController],
  providers: [
    RequestShipmentHandler,
    GetShipmentQueryHandler,
    ShipmentService,
    ShipmentDeliveryScheduler,
    { provide: ShipmentRepositoryPort, useClass: ShipmentRepository },
    { provide: ShipmentQueryPort, useClass: ShipmentQuery },
    { provide: CarrierPort, useClass: MockCarrierAdapter },
  ],
  exports: [ShipmentService],
})
export class ShipmentModule {}
