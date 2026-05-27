import { Money } from '@order/domain/vo/money.vo';
import { Order } from '@order/domain/models/order.model';
import { OrderItem } from '@order/domain/models/order-item.model';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderId } from 'src/order/domain/vo/order-id.vo';

describe('Order', () => {
  describe('create', () => {
    it('should create a new order', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      expect(order).toBeInstanceOf(Order);
    });

    it('should throw an error when items is empty', () => {
      expect(() => Order.create('1', [])).toThrow('items should be non-empty');
    });

    it('should create an order with default status', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      expect(order.getOrderStatus()).toBe(OrderStatus.PENDING);
    });

    it('should calculate total price correctly', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
        OrderItem.create('b', Money.create(200, 'KRW'), 2),
      ]);
      expect(order.getTotalPrice().getAmount()).toBe(500);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an order', () => {
      const order = Order.reconstitute(
        OrderId.create('550e8400-e29b-41d4-a716-446655440000'),
        '1',
        OrderStatus.PENDING,
        [OrderItem.create('a', Money.create(100, 'KRW'), 1)],
        Money.create(100, 'KRW'),
      );
      expect(order).toBeInstanceOf(Order);
    });
  });

  describe('addItem', () => {
    it('should add an item to the order', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.addItem('b', Money.create(200, 'KRW'), 2);
      expect(order.getOrderItems().length).toBe(2);
    });

    it('should throw an error when order is not in PENDING state', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.confirm();
      expect(() => order.addItem('b', Money.create(200, 'KRW'), 2)).toThrow(
        'order is not in PENDING state',
      );
    });

    it('should throw an error when name is empty', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      expect(() => order.addItem('', Money.create(200, 'KRW'), 2)).toThrow(
        'name should not be empty',
      );
    });

    it('should throw an error when quantity is not positive', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      expect(() => order.addItem('b', Money.create(200, 'KRW'), 0)).toThrow(
        'quantity should be positive',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel an order', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.cancel();
      expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    });

    it('should throw an error when order is in SHIPPED state', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.confirm();
      order.ship();
      expect(() => order.cancel()).toThrow('cannot cancel a shipped order');
    });
  });

  describe('confirm', () => {
    it('should confirm an order', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.confirm();
      expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw an error when order is not in PENDING state', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.confirm();
      expect(() => order.confirm()).toThrow('order is not in PENDING state');
    });
  });

  describe('ship', () => {
    it('should ship an order', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      order.confirm();
      order.ship();
      expect(order.getOrderStatus()).toBe(OrderStatus.SHIPPED);
    });

    it('should throw an error when order is not in CONFIRMED state', () => {
      const order = Order.create('1', [
        OrderItem.create('a', Money.create(100, 'KRW'), 1),
      ]);
      expect(() => order.ship()).toThrow('order is not in CONFIRMED state');
    });
  });
});
