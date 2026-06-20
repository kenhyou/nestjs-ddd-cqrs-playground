import { Injectable } from '@nestjs/common';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

export type OrderItemInput = {
  productId: string;
  productName: string;
  unitPrice: number;
  currency: string;
  quantity: number;
};

@Injectable()
export class OrderFactory {
  create(customerId: string, items: OrderItemInput[]): Order {
    const orderItems = items.map((item) => {
      return OrderItem.create(
        item.productId,
        item.productName,
        Money.create(item.unitPrice, item.currency),
        Quantity.create(item.quantity),
      );
    });

    return Order.create(customerId, orderItems);
  }
}
