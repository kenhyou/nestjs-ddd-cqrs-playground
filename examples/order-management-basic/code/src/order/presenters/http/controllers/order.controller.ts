import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AddOrderItemCommand } from '@order/application/commands/add-order-item.command';
import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { ShipOrderCommand } from '@order/application/commands/ship-order.command';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { GetOrderQuery } from '@order/application/queries/get-order.query';
import { AddOrderItemRequest } from '@order/presenters/http/dtos/add-order-item.request';
import { CreateOrderRequest } from '@order/presenters/http/dtos/create-order.request';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderRequest,
  ): Promise<{ orderId: string }> {
    const orderId = await this.commandBus.execute<CreateOrderCommand, string>(
      new CreateOrderCommand(dto.customerId, dto.items),
    );

    return { orderId };
  }

  @Get(':id')
  async getOrder(@Param('id') orderId: string): Promise<OrderReadModel | null> {
    return this.queryBus.execute(new GetOrderQuery(orderId));
  }

  @Post(':id/items')
  async addOrderItem(
    @Param('id') orderId: string,
    @Body() dto: AddOrderItemRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new AddOrderItemCommand(
        orderId,
        dto.name,
        dto.quantity,
        dto.unitPrice,
        dto.currency,
      ),
    );
  }

  @Post(':id/confirm')
  async confirmOrder(@Param('id') orderId: string): Promise<void> {
    await this.commandBus.execute(new ConfirmOrderCommand(orderId));
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') orderId: string): Promise<void> {
    await this.commandBus.execute(new CancelOrderCommand(orderId));
  }

  @Post(':id/ship')
  async shipOrder(@Param('id') orderId: string): Promise<void> {
    await this.commandBus.execute(new ShipOrderCommand(orderId));
  }
}
