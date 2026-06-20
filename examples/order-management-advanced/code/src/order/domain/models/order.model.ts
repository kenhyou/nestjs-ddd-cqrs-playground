import { OrderStatus } from '@order/domain/enums/order-status.enum';
import {
  InvalidOrderStateException,
  OrderNotCancellableException,
} from '@order/domain/exceptions/order.exceptions';
import { OrderCancelledEvent } from '@order/domain/events/order-cancelled.event';
import { OrderConfirmedEvent } from '@order/domain/events/order-confirmed.event';
import { OrderDeliveredEvent } from '@order/domain/events/order-delivered.event';
import { OrderPlacedEvent } from '@order/domain/events/order-placed.event';
import { OrderShippedEvent } from '@order/domain/events/order-shipped.event';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { AggregateRoot } from '@shared/domain/aggregate-root';

export class Order extends AggregateRoot {
  private constructor(
    private readonly id: OrderId,
    private readonly customerId: string,
    private orderStatus: OrderStatus,
    private readonly totalPrice: Money,
    private readonly items: OrderItem[],
    // Denormalized read-model projections of the saga's payment/shipment legs.
    private paymentStatus: string | null = null,
    private shipmentStatus: string | null = null,
  ) {
    super();
  }

  static create(customerId: string, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new Error('Order must have at least one item.');
    }

    const currency = items[0].getUnitPrice().getCurrency();

    const order = new Order(
      OrderId.generate(),
      customerId,
      OrderStatus.PENDING,
      items.reduce(
        (sum, item) => sum.add(item.getLineTotal()),
        Money.create(0, currency),
      ),
      items,
    );

    order.record(new OrderPlacedEvent(order.id.getValue()));
    return order;
  }

  static reconstitute(
    id: OrderId,
    customerId: string,
    orderStatus: OrderStatus,
    totalPrice: Money,
    items: OrderItem[],
    paymentStatus: string | null = null,
    shipmentStatus: string | null = null,
  ): Order {
    return new Order(
      id,
      customerId,
      orderStatus,
      totalPrice,
      items,
      paymentStatus,
      shipmentStatus,
    );
  }

  confirm(): void {
    if (this.orderStatus !== OrderStatus.PENDING) {
      throw new InvalidOrderStateException(
        'Order must be in PENDING state to be confirmed.',
      );
    }
    this.orderStatus = OrderStatus.CONFIRMED;

    this.record(
      new OrderConfirmedEvent(
        this.id.getValue(),
        this.totalPrice.getAmount(),
        this.totalPrice.getCurrency(),
      ),
    );
  }

  markPendingShipment(): void {
    if (this.orderStatus !== OrderStatus.CONFIRMED) {
      throw new InvalidOrderStateException(
        'Order must be in CONFIRMED state to be marked as PENDING_SHIPMENT.',
      );
    }

    this.orderStatus = OrderStatus.PENDING_SHIPMENT;
  }

  ship(): void {
    if (this.orderStatus !== OrderStatus.PENDING_SHIPMENT) {
      throw new InvalidOrderStateException(
        'Order must be in PENDING_SHIPMENT state to be shipped.',
      );
    }

    this.orderStatus = OrderStatus.SHIPPED;

    this.record(new OrderShippedEvent(this.id.getValue()));
  }

  deliver(): void {
    if (this.orderStatus !== OrderStatus.SHIPPED) {
      throw new InvalidOrderStateException(
        'Order must be in SHIPPED state to be delivered.',
      );
    }

    this.orderStatus = OrderStatus.DELIVERED;

    this.record(new OrderDeliveredEvent(this.id.getValue()));
  }

  isCancellable(): boolean {
    return [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PENDING_SHIPMENT,
    ].includes(this.orderStatus);
  }

  cancel(): void {
    if (!this.isCancellable()) {
      throw new OrderNotCancellableException(
        'Order can be cancelled only before it ships.',
      );
    }

    this.orderStatus = OrderStatus.CANCELLED;

    this.record(new OrderCancelledEvent(this.id.getValue()));
  }

  // Denormalized projections updated by the saga (D4b) for the read model.
  recordPaymentStatus(status: string): void {
    this.paymentStatus = status;
  }

  recordShipmentStatus(status: string): void {
    this.shipmentStatus = status;
  }

  getOrderId(): OrderId {
    return this.id;
  }

  getCustomerId(): string {
    return this.customerId;
  }

  getOrderStatus(): OrderStatus {
    return this.orderStatus;
  }

  getTotalPrice(): Money {
    return this.totalPrice;
  }

  getOrderItems(): OrderItem[] {
    return [...this.items];
  }

  getPaymentStatus(): string | null {
    return this.paymentStatus;
  }

  getShipmentStatus(): string | null {
    return this.shipmentStatus;
  }
}
