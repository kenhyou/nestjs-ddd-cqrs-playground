import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { InvalidOrderStateException } from '@order/domain/exceptions/invalid-order-state.exception';

export class Order {
  private constructor(
    private readonly orderId: OrderId,
    private readonly customerId: string,
    private orderStatus: OrderStatus,
    private readonly totalPrice: Money,
    private readonly orderItems: OrderItem[],
  ) {}

  static create(customerId: string, items: OrderItem[]): Order {
    if (customerId.trim().length < 1) {
      throw new Error('Customer ID must not be empty.');
    }

    if (items.length < 1) {
      throw new Error('Items must not be empty.');
    }

    const orderId = OrderId.generate();
    const orderStatus = OrderStatus.PENDING;
    const currency = items[0].getUnitPrice().getCurrency();
    const totalPrice = items.reduce(
      (sum, item) => sum.add(item.getTotalPrice()),
      Money.create(0, currency),
    );

    return new Order(orderId, customerId, orderStatus, totalPrice, items);
  }

  static reconstitute(
    orderId: OrderId,
    customerId: string,
    orderStatus: OrderStatus,
    totalPrice: Money,
    orderItems: OrderItem[],
  ): Order {
    return new Order(orderId, customerId, orderStatus, totalPrice, orderItems);
  }

  confirm(): void {
    if (this.orderStatus !== OrderStatus.PENDING) {
      throw new InvalidOrderStateException(
        'Order must be in PENDING state to be confirmed.',
      );
    }
    this.orderStatus = OrderStatus.CONFIRMED;
  }

  ship(isReadyToShip: boolean): void {
    if (this.orderStatus !== OrderStatus.CONFIRMED) {
      throw new InvalidOrderStateException(
        'Order must be in CONFIRMED state to be shipped.',
      );
    }
    if (!isReadyToShip) {
      throw new InvalidOrderStateException(
        'Order must be ready to ship to be shipped.',
      );
    }
    this.orderStatus = OrderStatus.SHIPPED;
  }

  cancel(): void {
    if (
      this.orderStatus !== OrderStatus.PENDING &&
      this.orderStatus !== OrderStatus.CONFIRMED
    ) {
      throw new InvalidOrderStateException(
        'Order must be in PENDING or CONFIRMED state to be cancelled.',
      );
    }
    this.orderStatus = OrderStatus.CANCELLED;
  }

  isConfirmed(): boolean {
    return this.orderStatus === OrderStatus.CONFIRMED;
  }

  getOrderId(): OrderId {
    return this.orderId;
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
    return [...this.orderItems];
  }
}
