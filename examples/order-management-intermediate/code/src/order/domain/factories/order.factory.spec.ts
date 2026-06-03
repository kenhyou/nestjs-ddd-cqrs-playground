import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { Quantity } from '@order/domain/vo/quantity.vo';

describe('OrderFactory', () => {
  it('should create order with items', () => {
    const unitPrice = 1000;
    const quantity = 2;
    const currency = 'KRW';
    const productId = 'product-id';
    const productName = 'product';
    const customerId = 'customer-id';
    const orderFactoyr = new OrderFactory();
    const order = orderFactoyr.create(customerId, [
      {
        unitPrice,
        quantity,
        currency,
        productId,
        productName,
      },
    ]);

    expect(order).toBeInstanceOf(Order);
    expect(order.getCustomerId()).toBe(customerId);
    expect(order.getOrderItems()).toHaveLength(1);
    expect(order.getOrderItems()[0]).toBeInstanceOf(OrderItem);
    expect(order.getTotalPrice().getAmount()).toBe(2000);
    expect(order.getOrderStatus()).toBe(OrderStatus.PENDING);
  });
});
