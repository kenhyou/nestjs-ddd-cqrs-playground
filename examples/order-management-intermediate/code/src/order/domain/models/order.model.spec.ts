import { Order } from '@order/domain/models/order.model';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';
import { OrderStatus } from '@order/domain/enums/order-status.enum';

const buildItem = (
  unitPrice: number,
  quantity: number,
  currency = 'KRW',
  productId = 'prod-1',
): OrderItem =>
  OrderItem.create(
    productId,
    'Product 1',
    Money.create(unitPrice, currency),
    Quantity.create(quantity),
  );

describe('Order', () => {
  it('rejects an empty customer ID', () => {
    expect(() => Order.create('', [buildItem(1000, 1)])).toThrow();
  });

  it('rejects an empty items list', () => {
    expect(() => Order.create('customer-id', [])).toThrow();
  });

  it('can be created with valid parameters and computes the total', () => {
    const order = Order.create('customer-id', [buildItem(1000, 2)]);
    expect(order).toBeInstanceOf(Order);
    expect(order.getTotalPrice().getAmount()).toBe(2000);
  });

  it('confirms a pending order, but not twice', () => {
    const order = Order.create('c1', [buildItem(1000, 1)]);
    order.confirm();
    expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);

    expect(() => order.confirm()).toThrow();
  });

  it('cancels from CONFIRMED but not after SHIPPED', () => {
    const order = Order.create('c1', [buildItem(1000, 1)]);
    order.confirm();
    order.ship(true);
    expect(() => order.cancel()).toThrow(); // the bug you fixed earlier
  });

  it('rejects items with mixed currencies', () => {
    expect(() =>
      Order.create('c1', [buildItem(1000, 1, 'KRW'), buildItem(10, 1, 'USD')]),
    ).toThrow();
  });

  it('ships a confirmed order only when ready to ship', () => {
    const order = Order.create('c1', [buildItem(1000, 1)]);
    order.confirm();
    order.ship(true);
    expect(order.getOrderStatus()).toBe(OrderStatus.SHIPPED);
  });

  it('refuses to ship when not confirmed', () => {
    const order = Order.create('c1', [buildItem(1000, 1)]); // still PENDING
    expect(() => order.ship(true)).toThrow();
  });

  it('refuses to ship when payment is not ready (isReadyToShip=false)', () => {
    const order = Order.create('c1', [buildItem(1000, 1)]);
    order.confirm();
    expect(() => order.ship(false)).toThrow(); // the cross-aggregate guard
  });
});
