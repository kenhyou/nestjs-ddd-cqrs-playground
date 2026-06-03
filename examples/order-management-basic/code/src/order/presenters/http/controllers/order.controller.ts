import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { OrderService } from '@order/application/services/order.service';
import { AddOrderItemRequest } from '@order/presenters/http/dtos/add-order-item.request';
import { CreateOrderRequest } from '@order/presenters/http/dtos/create-order.request';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderRequest,
  ): Promise<{ orderId: string }> {
    const orderId = await this.orderService.createOrder(
      dto.customerId,
      dto.items,
    );

    return { orderId };
  }

  @Get(':id')
  async getOrder(@Param('id') orderId: string): Promise<OrderReadModel | null> {
    return this.orderService.getOrder(orderId);
  }

  @Post(':id/items')
  async addOrderItem(
    @Param('id') orderId: string,
    @Body() dto: AddOrderItemRequest,
  ): Promise<void> {
    await this.orderService.addOrderItem(
      orderId,
      dto.name,
      dto.quantity,
      dto.unitPrice,
      dto.currency,
    );
  }

  @Post(':id/confirm')
  async confirmOrder(@Param('id') orderId: string): Promise<void> {
    await this.orderService.confirmOrder(orderId);
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') orderId: string): Promise<void> {
    await this.orderService.cancelOrder(orderId);
  }

  @Post(':id/ship')
  async shipOrder(@Param('id') orderId: string): Promise<void> {
    await this.orderService.shipOrder(orderId);
  }
}
