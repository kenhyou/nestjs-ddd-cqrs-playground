import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { GetOrderQuery } from '@order/application/queries/get-order.query';
import { OrderItemInput } from '@order/domain/factories/order.factory';

@Injectable()
export class OrderService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getOrder(orderId: string): Promise<OrderReadModel> {
    return this.queryBus.execute(new GetOrderQuery(orderId));
  }

  createOrder(customerId: string, items: OrderItemInput[]): Promise<string> {
    return this.commandBus.execute(new CreateOrderCommand(customerId, items));
  }

  confirmOrder(orderId: string): Promise<void> {
    return this.commandBus.execute(new ConfirmOrderCommand(orderId));
  }

  cancelOrder(orderId: string): Promise<void> {
    return this.commandBus.execute(new CancelOrderCommand(orderId));
  }
}
