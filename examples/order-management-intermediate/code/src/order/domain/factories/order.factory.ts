import { Injectable } from '@nestjs/common';
import { Order } from '@order/domain/models/order.model';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

@Injectable()
export class OrderFactory {
  create(
    customerId: string,
    items: {
      productId: string;
      productName: string;
      unitPrice: number;
      currency: string;
      quantity: number;
    }[],
  ): Order {
    return Order.create(
      customerId,
      items.map((item) =>
        OrderItem.create(
          item.productId,
          item.productName,
          Money.create(item.unitPrice, item.currency),
          Quantity.create(item.quantity),
        ),
      ),
    );
  }
}
