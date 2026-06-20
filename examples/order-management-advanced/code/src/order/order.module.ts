import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { CancelOrderCommandHandler } from '@order/application/commands/handlers/cancel-order.command.handler';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { CreateOrderCommandHandler } from '@order/application/commands/handlers/create-order.command.handler';
import { PaymentFailedHandler } from '@order/application/events/handlers/payment-failed.handler';
import { PaymentSucceededHandler } from '@order/application/events/handlers/payment-succeeded.handler';
import { RefundIssuedHandler } from '@order/application/events/handlers/refund-issued.handler';
import { ShipmentDeliveredHandler } from '@order/application/events/handlers/shipment-delivered.handler';
import { ShipmentDispatchedHandler } from '@order/application/events/handlers/shipment-dispatched.handler';
import { ShipmentFailedHandler } from '@order/application/events/handlers/shipment-failed.handler';
import { StartSagaHandler } from '@order/application/events/handlers/start-saga.handler';
import { GetOrderQueryHandler } from '@order/application/queries/handlers/get-order.query.handler';
import { OrderService } from '@order/application/services/order.service';
import { OrderFactory } from '@order/domain/factories/order.factory';
import { FulfillmentSagaEntity } from '@order/infra/entities/fulfillment-saga.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderQuery } from '@order/infra/queries/order.query';
import { OrderRepository } from '@order/infra/repositories/order.repository';
import { SagaRepository } from '@order/infra/repositories/saga.repository';
import { SagaTimeoutScheduler } from '@order/infra/scheduler/saga-timeout.scheduler';
import { OrderController } from '@order/presenters/http/controllers/order.controller';
import { OutboxModule } from '@outbox/outbox.module';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      FulfillmentSagaEntity,
    ]),
    OutboxModule,
  ],
  controllers: [OrderController],
  providers: [
    // Commands + Query
    CreateOrderCommandHandler,
    ConfirmOrderCommandHandler,
    CancelOrderCommandHandler,
    GetOrderQueryHandler,
    // Saga event handlers (discovered by the outbox MessageDispatcher)
    StartSagaHandler,
    PaymentSucceededHandler,
    PaymentFailedHandler,
    RefundIssuedHandler,
    ShipmentDispatchedHandler,
    ShipmentDeliveredHandler,
    ShipmentFailedHandler,
    // Facade + factory + scheduler
    OrderService,
    OrderFactory,
    SagaTimeoutScheduler,
    // Ports → infra implementations
    { provide: OrderRepositoryPort, useClass: OrderRepository },
    { provide: SagaRepositoryPort, useClass: SagaRepository },
    { provide: OrderQueryPort, useClass: OrderQuery },
  ],
  exports: [OrderService],
})
export class OrderModule {}
