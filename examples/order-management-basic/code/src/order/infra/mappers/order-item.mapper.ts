import { Injectable } from '@nestjs/common';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';

@Injectable()
export class OrderItemMapper {
  toOrm(orderItem: OrderItem): OrderItemEntity {
    const entity = new OrderItemEntity();
    entity.orderItemId = orderItem.getOrderItemId().getValue();
    entity.name = orderItem.getName();
    entity.unitPrice = orderItem.getUnitPrice().getAmount();
    entity.currency = orderItem.getUnitPrice().getCurrency();
    entity.quantity = orderItem.getQuantity();
    return entity;
  }

  toDomain(entity: OrderItemEntity): OrderItem {
    return OrderItem.reconstitute(
      OrderItemId.create(entity.orderItemId),
      entity.name,
      Money.create(entity.unitPrice, entity.currency),
      entity.quantity,
    );
  }
}
