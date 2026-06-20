import { Order } from '@order/domain/models/order.model';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderPlacedEvent } from '@order/domain/events/order-placed.event';
import { OrderConfirmedEvent } from '@order/domain/events/order-confirmed.event';
import { OrderShippedEvent } from '@order/domain/events/order-shipped.event';
import { OrderDeliveredEvent } from '@order/domain/events/order-delivered.event';
import { OrderCancelledEvent } from '@order/domain/events/order-cancelled.event';

const buildOrder = () => {
  return Order.create('cust-1', [
    OrderItem.create(
      'p-id',
      'p-name',
      Money.create(100, 'USD'),
      Quantity.create(2),
    ),
  ]);
};

describe('Order', () => {
  it('creates an order successfully', () => {
    const order = buildOrder();

    expect(order).toBeInstanceOf(Order);
    expect(order.getCustomerId()).toBe('cust-1');
    expect(order.getTotalPrice()).toEqual(Money.create(200, 'USD'));
    expect(order.getOrderItems().length).toBe(1);

    const events = order.pullEvents();
    expect(events.length).toBe(1);
    expect(events.at(-1)).toBeInstanceOf(OrderPlacedEvent);
  });

  it('reconstitutes an order successfully', () => {
    const order = buildOrder();

    const reconstitutedOrder = Order.reconstitute(
      order.getOrderId(),
      order.getCustomerId(),
      order.getOrderStatus(),
      order.getTotalPrice(),
      order.getOrderItems(),
    );

    expect(reconstitutedOrder.getOrderId()).toEqual(order.getOrderId());
    expect(reconstitutedOrder.getCustomerId()).toEqual(order.getCustomerId());
    expect(reconstitutedOrder.getOrderStatus()).toEqual(order.getOrderStatus());
    expect(reconstitutedOrder.getTotalPrice()).toEqual(order.getTotalPrice());
    expect(reconstitutedOrder.getOrderItems()).toEqual(order.getOrderItems());

    const events = reconstitutedOrder.pullEvents();
    expect(events.length).toBe(0);
  });

  it('throws error when creating order with no items', () => {
    expect(() => Order.create('cust-1', [])).toThrow();
  });

  it('confirms an order successfully', () => {
    const order = buildOrder();

    order.confirm();

    expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);

    const events = order.pullEvents();
    expect(events.length).toBe(2);
    expect(events.at(-1)).toBeInstanceOf(OrderConfirmedEvent);

    const confirmedEventPayload = events.at(-1)?.payload();
    expect(confirmedEventPayload!.orderId).toBe(order.getOrderId().getValue());
    expect(confirmedEventPayload!.totalPrice).toEqual(
      order.getTotalPrice().getAmount(),
    );
    expect(confirmedEventPayload!.currency).toBe(
      order.getTotalPrice().getCurrency(),
    );
  });

  it('throws error when confirming order that is not pending', () => {
    const order = buildOrder();

    order.confirm();

    expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);

    expect(() => order.confirm()).toThrow();
  });

  it('marks an order in pending shipment', () => {
    const order = buildOrder();

    order.confirm();
    order.markPendingShipment();

    expect(order.getOrderStatus()).toBe(OrderStatus.PENDING_SHIPMENT);

    const events = order.pullEvents();
    expect(events.length).toBe(2);
  });

  it('fails to mark pending shipment if an order is not in confirmed state', () => {
    const order = buildOrder();

    expect(() => order.markPendingShipment()).toThrow();
  });

  it('ships an order successfully', () => {
    const order = buildOrder();

    order.confirm();
    order.markPendingShipment();
    order.ship();

    expect(order.getOrderStatus()).toBe(OrderStatus.SHIPPED);

    const events = order.pullEvents();
    expect(events.length).toBe(3);
    expect(events.at(-1)).toBeInstanceOf(OrderShippedEvent);
  });

  it('fails to ship an order if it is not in pending shipment state', () => {
    const order = buildOrder();

    expect(() => order.ship()).toThrow();
  });

  it('delivers an order successfully', () => {
    const order = buildOrder();

    order.confirm();
    order.markPendingShipment();
    order.ship();
    order.deliver();

    expect(order.getOrderStatus()).toBe(OrderStatus.DELIVERED);

    const events = order.pullEvents();
    expect(events.length).toBe(4);
    expect(events.at(-1)).toBeInstanceOf(OrderDeliveredEvent);
  });

  it('fails to deliver an order if it is not in shipped state', () => {
    const order = buildOrder();

    expect(() => order.deliver()).toThrow();

    order.confirm();
    order.markPendingShipment();

    expect(() => order.deliver()).toThrow();
  });

  it('cancels an order successfully', () => {
    const order = buildOrder();

    order.cancel();

    expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);

    const events = order.pullEvents();
    expect(events.length).toBe(2);
    expect(events.at(-1)).toBeInstanceOf(OrderCancelledEvent);
  });

  it('fails to cancel an order if it is not in a cancellable state', () => {
    const order1 = buildOrder();
    order1.confirm();
    order1.markPendingShipment();
    order1.ship();
    order1.deliver();

    expect(() => order1.cancel()).toThrow();

    const order2 = buildOrder();
    order2.confirm();
    order2.markPendingShipment();
    order2.ship();

    expect(() => order2.cancel()).toThrow();
  });
});
