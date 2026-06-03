import { Order } from '@order/domain/models/order.model';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { Money } from '@order/domain/vo/money.vo';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderMapper {
  constructor(private readonly orderItemMapper: OrderItemMapper) {}

  toOrm(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.orderId = order.getOrderId().getValue();
    entity.customerId = order.getCustomerId();
    entity.status = order.getOrderStatus();
    entity.items = order
      .getOrderItems()
      .map((item) => this.orderItemMapper.toOrm(item));
    entity.totalAmount = order.getTotalPrice().getAmount();
    entity.totalCurrency = order.getTotalPrice().getCurrency();
    return entity;
  }

  toDomain(entity: OrderEntity): Order {
    return Order.reconstitute(
      OrderId.create(entity.orderId),
      entity.customerId,
      entity.status,
      entity.items.map((item) => this.orderItemMapper.toDomain(item)),
      Money.create(entity.totalAmount, entity.totalCurrency),
    );
  }
}
