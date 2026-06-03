import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderController } from '@order/presenters/http/controllers/order.controller';
import { PaymentPortsModule } from '@order/payment-ports.module';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderRepository } from '@order/infra/repositories/order.repository';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderQuery } from '@order/infra/queries/order.query';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderFactory } from '@order/domain/factories/order.factory';
import { PaymentCoordinator } from '@order/domain/services/payment-coordinator';
import { OrderService } from '@order/application/services/order.service';
import { CreateOrderCommandHandler } from '@order/application/commands/handlers/create-order.command.handler';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { CancelOrderCommandHandler } from '@order/application/commands/handlers/cancel-order.command.handler';
import { ShipOrderCommandHandler } from '@order/application/commands/handlers/ship-order.command.handler';
import { GetOrderQueryHandler } from '@order/application/queries/handlers/get-order.query.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
    PaymentPortsModule, // ← cross-BC ports (NOT PaymentModule directly)
  ],
  controllers: [OrderController],
  providers: [
    // mappers
    OrderMapper,
    OrderItemMapper,
    // domain services (@Injectable)
    OrderFactory,
    PaymentCoordinator,
    // facade
    OrderService,
    // command handlers
    CreateOrderCommandHandler,
    ConfirmOrderCommandHandler,
    CancelOrderCommandHandler,
    ShipOrderCommandHandler,
    // query handler
    GetOrderQueryHandler,
    // port bindings
    { provide: OrderRepositoryPort, useClass: OrderRepository },
    { provide: OrderQueryPort, useClass: OrderQuery },
  ],
})
export class OrderModule {}
