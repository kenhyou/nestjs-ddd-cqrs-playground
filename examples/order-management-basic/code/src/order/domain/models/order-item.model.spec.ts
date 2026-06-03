import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { OrderItem } from './order-item.model';
import { Money } from '@order/domain/vo/money.vo';

describe('OrderItem', () => {
  describe('create', () => {
    it('should create a new order item', () => {
      const orderItem = OrderItem.create('a', Money.create(100, 'KRW'), 1);
      expect(orderItem).toBeInstanceOf(OrderItem);
    });

    it('should throw an error when name is empty', () => {
      expect(() => OrderItem.create('', Money.create(100, 'KRW'), 1)).toThrow(
        'name should not be empty',
      );
    });

    it('should throw an error when quantity is not positive', () => {
      expect(() => OrderItem.create('a', Money.create(100, 'KRW'), 0)).toThrow(
        'quantity should be positive',
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an order item', () => {
      const orderItem = OrderItem.reconstitute(
        OrderItemId.create(),
        'a',
        Money.create(100, 'KRW'),
        1,
      );
      expect(orderItem).toBeInstanceOf(OrderItem);
    });

    it('quantity 0 is allow in reconstitue', () => {
      const orderItem = OrderItem.reconstitute(
        OrderItemId.create(),
        'a',
        Money.create(100, 'KRW'),
        0,
      );
      expect(orderItem.getQuantity()).toBe(0);
    });
  });

  describe('getTotalPrice', () => {
    it('should calculate total price correctly', () => {
      const orderItem = OrderItem.create('a', Money.create(100, 'KRW'), 2);
      expect(orderItem.getTotalPrice().getAmount()).toBe(200);
    });
  });
});
