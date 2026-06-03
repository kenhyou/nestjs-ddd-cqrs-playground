import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { OrderService } from '@order/application/services/order.service';
import { ConfirmOrderRequest } from '@order/presenters/http/dtos/confirm-order.request';
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

  @Post(':id/confirm')
  async confirmOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: ConfirmOrderRequest,
  ): Promise<void> {
    await this.orderService.confirmOrder(orderId, dto.paymentMethod);
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id', ParseUUIDPipe) orderId: string): Promise<void> {
    await this.orderService.cancelOrder(orderId);
  }

  @Post(':id/ship')
  async shipOrder(@Param('id', ParseUUIDPipe) orderId: string): Promise<void> {
    await this.orderService.shipOrder(orderId);
  }

  @Get(':id')
  async getOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
  ): Promise<OrderReadModel | null> {
    return await this.orderService.getOrder(orderId);
  }
}
