import { Injectable } from '@nestjs/common';
import { Order } from '@order/domain/models/order.model';
import { OrderEntity } from '../entities/order.entity';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';

@Injectable()
export class OrderMapper {
  constructor(private readonly orderItemMapper: OrderItemMapper) {}

  toOrm(order: Order): OrderEntity {
    const e = new OrderEntity();
    e.orderId = order.getOrderId().getValue();
    e.customerId = order.getCustomerId();
    e.status = order.getOrderStatus();
    e.totalAmount = order.getTotalPrice().getAmount();
    e.totalCurrency = order.getTotalPrice().getCurrency();
    e.items = order
      .getOrderItems()
      .map((item) => this.orderItemMapper.toOrm(item));
    return e;
  }

  toDomain(e: OrderEntity): Order {
    return Order.reconstitute(
      OrderId.create(e.orderId),
      e.customerId,
      e.status,
      Money.create(e.totalAmount, e.totalCurrency),
      e.items.map((i) => this.orderItemMapper.toDomain(i)),
    );
  }
}
