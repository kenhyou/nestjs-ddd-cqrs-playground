import { Injectable } from '@nestjs/common';
import { OrderItem } from '@order/domain/models/order-item.model';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { Money } from '@order/domain/vo/money.vo';
import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

@Injectable()
export class OrderItemMapper {
  toOrm(item: OrderItem): OrderItemEntity {
    const e = new OrderItemEntity();
    e.orderItemId = item.getOrderItemId().getValue();
    e.productId = item.getProductId();
    e.productName = item.getProductName();
    e.unitPrice = item.getUnitPrice().getAmount();
    e.unitCurrency = item.getUnitPrice().getCurrency();
    e.quantity = item.getQuantity().getValue();

    return e;
  }

  toDomain(e: OrderItemEntity): OrderItem {
    return OrderItem.reconstitute(
      OrderItemId.create(e.orderItemId),
      e.productId,
      e.productName,
      Money.create(e.unitPrice, e.unitCurrency),
      Quantity.create(e.quantity),
    );
  }
}
