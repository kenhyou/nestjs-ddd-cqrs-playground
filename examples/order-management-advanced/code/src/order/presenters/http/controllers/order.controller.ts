import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { OrderService } from '@order/application/services/order.service';
import { CreateOrderRequest } from '@order/presenters/http/dtos/create-order.request';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(
    @Body() body: CreateOrderRequest,
  ): Promise<{ orderId: string }> {
    const orderId = await this.orderService.createOrder(
      body.customerId,
      body.items,
    );
    return { orderId };
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.orderService.confirmOrder(id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.orderService.cancelOrder(id);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<OrderReadModel> {
    return this.orderService.getOrder(id);
  }
}
