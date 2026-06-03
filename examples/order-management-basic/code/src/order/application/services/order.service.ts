import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AddOrderItemCommand } from '@order/application/commands/add-order-item.command';
import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { ShipOrderCommand } from '@order/application/commands/ship-order.command';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { GetOrderQuery } from '@order/application/queries/get-order.query';

@Injectable()
export class OrderService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  createOrder(
    customerId: string,
    items: CreateOrderCommand['items'],
  ): Promise<string> {
    return this.commandBus.execute(new CreateOrderCommand(customerId, items));
  }

  addOrderItem(
    orderId: string,
    name: string,
    quantity: number,
    unitPrice: number,
    currency: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new AddOrderItemCommand(orderId, name, quantity, unitPrice, currency),
    );
  }

  confirmOrder(orderId: string): Promise<void> {
    return this.commandBus.execute(new ConfirmOrderCommand(orderId));
  }

  cancelOrder(orderId: string): Promise<void> {
    return this.commandBus.execute(new CancelOrderCommand(orderId));
  }

  shipOrder(orderId: string): Promise<void> {
    return this.commandBus.execute(new ShipOrderCommand(orderId));
  }

  getOrder(orderId: string): Promise<OrderReadModel | null> {
    return this.queryBus.execute(new GetOrderQuery(orderId));
  }
}
