import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

describe('OrderItem', () => {
  it('should create OrderItem', () => {
    const unitPrice = Money.create(1000, 'KRW');
    const quantity = Quantity.create(2);
    const orderItem = OrderItem.create(
      'product-id',
      'product',
      unitPrice,
      quantity,
    );
    expect(orderItem).toBeInstanceOf(OrderItem);
    expect(orderItem.getProductId()).toBe('product-id');
    expect(orderItem.getProductName()).toBe('product');
    expect(orderItem.getUnitPrice()).toBe(unitPrice);
    expect(orderItem.getQuantity()).toBe(quantity);
  });

  it('should get total price', () => {
    const unitPrice = Money.create(1000, 'KRW');
    const quantity = Quantity.create(2);
    const orderItem = OrderItem.create(
      'product-id',
      'product',
      unitPrice,
      quantity,
    );
    const totalPrice = orderItem.getTotalPrice();

    expect(totalPrice).toBeInstanceOf(Money);
    expect(totalPrice.getAmount()).toBe(2000);
    expect(totalPrice.getCurrency()).toBe('KRW');
  });
});
