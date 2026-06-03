import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';

export class Order {
  private constructor(
    private readonly orderId: OrderId,
    private readonly customerId: string,
    private orderStatus: OrderStatus,
    private readonly orderItems: OrderItem[],
    private totalPrice: Money,
  ) {}

  static create(customerId: string, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new Error('items should be non-empty');
    }

    const currency = items[0].getUnitPrice().getCurrency();

    const totalPrice = items.reduce(
      (acc, item) => acc.add(item.getTotalPrice()),
      Money.create(0, currency),
    );
    return new Order(
      OrderId.generate(),
      customerId,
      OrderStatus.PENDING,
      items,
      totalPrice,
    );
  }
  static reconstitute(
    orderId: OrderId,
    customerId: string,
    orderStatus: OrderStatus,
    orderItems: OrderItem[],
    totalPrice: Money,
  ): Order {
    return new Order(orderId, customerId, orderStatus, orderItems, totalPrice);
  }

  addItem(name: string, unitPrice: Money, quantity: number) {
    if (this.orderStatus !== OrderStatus.PENDING) {
      throw new Error('order is not in PENDING state');
    }

    if (name.trim() === '') {
      throw new Error('name should not be empty');
    }

    if (quantity <= 0) {
      throw new Error('quantity should be positive');
    }

    const item = OrderItem.create(name, unitPrice, quantity);
    this.orderItems.push(item);
    this.totalPrice = this.totalPrice.add(item.getTotalPrice());
  }

  confirm() {
    if (this.orderStatus !== OrderStatus.PENDING) {
      throw new Error('order is not in PENDING state');
    }

    if (this.orderItems.length === 0) {
      throw new Error('items should be non-empty');
    }

    this.orderStatus = OrderStatus.CONFIRMED;
  }

  cancel() {
    if (this.orderStatus === OrderStatus.SHIPPED) {
      throw new Error('cannot cancel a shipped order');
    }
    this.orderStatus = OrderStatus.CANCELLED;
  }

  ship() {
    if (this.orderStatus !== OrderStatus.CONFIRMED) {
      throw new Error('order is not in CONFIRMED state');
    }
    this.orderStatus = OrderStatus.SHIPPED;
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

  getOrderItems(): OrderItem[] {
    return this.orderItems;
  }

  getTotalPrice(): Money {
    return this.totalPrice;
  }
}
