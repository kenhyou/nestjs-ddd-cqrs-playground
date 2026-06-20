import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

describe('OrderItem', () => {
  it('creates OrderItem successfully', () => {
    const orderItem = OrderItem.create(
      'p-id',
      'p-name',
      Money.create(100, 'USD'),
      Quantity.create(2),
    );

    expect(orderItem).toBeInstanceOf(OrderItem);
    expect(orderItem.getProductId()).toBe('p-id');
    expect(orderItem.getProductName()).toBe('p-name');
    expect(orderItem.getUnitPrice()).toEqual(Money.create(100, 'USD'));
    expect(orderItem.getQuantity()).toEqual(Quantity.create(2));
  });

  it('calculates the line total successfully', () => {
    const orderItem = OrderItem.create(
      'p-id',
      'p-name',
      Money.create(100, 'USD'),
      Quantity.create(2),
    );

    expect(orderItem.getLineTotal()).toEqual(Money.create(200, 'USD'));
  });
});
