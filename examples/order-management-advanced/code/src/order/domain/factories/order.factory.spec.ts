import { OrderFactory } from '@order/domain/factories/order.factory';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';

describe('OrderFactory', () => {
  it('should create an order successfully', () => {
    const factory = new OrderFactory();
    const order = factory.create('cust-1', [
      {
        productId: 'proc-1',
        productName: 'prod-name-1',
        unitPrice: 100,
        currency: 'USD',
        quantity: 2,
      },
    ]);

    expect(order).toBeInstanceOf(Order);
    expect(order.getOrderItems().length).toBe(1);
    expect(order.getCustomerId()).toBe('cust-1');
    expect(order.getTotalPrice()).toEqual(Money.create(200, 'USD'));

    const orderItems = order.getOrderItems();
    const orderItem = orderItems[0];
    expect(orderItem.getProductName()).toBe('prod-name-1');
    expect(orderItem.getQuantity().getValue()).toBe(2);
    expect(orderItem.getUnitPrice().getAmount()).toBe(100);
    expect(orderItem.getUnitPrice().getCurrency()).toBe('USD');
    expect(orderItem.getLineTotal().getAmount()).toBe(200);
    expect(orderItem.getLineTotal().getCurrency()).toBe('USD');
  });

  it('fails to create an order if order items have mixed currencies', () => {
    const factory = new OrderFactory();

    expect(() =>
      factory.create('cust-1', [
        {
          productId: 'proc-1',
          productName: 'prod-name-1',
          unitPrice: 100,
          currency: 'USD',
          quantity: 2,
        },
        {
          productId: 'proc-2',
          productName: 'prod-name-2',
          unitPrice: 200,
          currency: 'EUR',
          quantity: 1,
        },
      ]),
    ).toThrow();
  });

  it('fails to create an order with an empty order items', () => {
    const factory = new OrderFactory();

    expect(() => factory.create('cust-1', [])).toThrow();
  });
});
