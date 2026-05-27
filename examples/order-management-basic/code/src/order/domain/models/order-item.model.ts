import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { Money } from '@order/domain/vo/money.vo';

export class OrderItem {
  private constructor(
    private readonly orderItemId: OrderItemId,
    private readonly name: string,
    private readonly unitPrice: Money,
    private readonly quantity: number,
  ) {}

  static create(name: string, unitPrice: Money, quantity: number): OrderItem {
    if (quantity <= 0) {
      throw new Error('quantity should be positive');
    }

    if (name.trim() === '') {
      throw new Error('name should not be empty');
    }

    return new OrderItem(OrderItemId.create(), name, unitPrice, quantity);
  }

  static reconstitute(
    orderItemId: OrderItemId,
    name: string,
    unitPrice: Money,
    quantity: number,
  ): OrderItem {
    return new OrderItem(orderItemId, name, unitPrice, quantity);
  }

  getOrderItemId(): OrderItemId {
    return this.orderItemId;
  }

  getName(): string {
    return this.name;
  }

  getUnitPrice(): Money {
    return this.unitPrice;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getTotalPrice(): Money {
    return this.unitPrice.multiply(this.quantity);
  }
}
