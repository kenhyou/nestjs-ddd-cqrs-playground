import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderController } from '@order/presenters/http/controllers/order.controller';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderRepository } from '@order/infra/repositories/order.repository';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { CreateOrderCommandHandler } from '@order/application/commands/handlers/create-order.command.handler';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { CancelOrderCommandHandler } from '@order/application/commands/handlers/cancel-order.command.handler';
import { GetOrderQueryHandler } from '@order/application/queries/handlers/get-order.query.handler';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { ShipOrderCommandHandler } from '@order/application/commands/handlers/ship-order.command.handler';
import { OrderQuery } from '@order/infra/queries/order.query';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { AddOrderItemCommandHandler } from '@order/application/commands/handlers/add-order-item.command.handler';
import { OrderService } from '@order/application/services/order.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
  ],
  controllers: [OrderController],
  providers: [
    // Facade
    OrderService,

    // Mapper
    OrderMapper,
    OrderItemMapper,

    // Command Handlers
    CreateOrderCommandHandler,
    AddOrderItemCommandHandler,
    ConfirmOrderCommandHandler,
    CancelOrderCommandHandler,
    ShipOrderCommandHandler,
    // Query Handlers
    GetOrderQueryHandler,
    {
      provide: OrderRepositoryPort,
      useClass: OrderRepository,
    },
    {
      provide: OrderQueryPort,
      useClass: OrderQuery,
    },
  ],
})
export class OrderModule {}
