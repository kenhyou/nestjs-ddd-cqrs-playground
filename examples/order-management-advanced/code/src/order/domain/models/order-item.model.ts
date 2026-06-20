import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

export class OrderItem {
  private constructor(
    private readonly id: OrderItemId,
    private readonly productId: string,
    private readonly productName: string,
    private readonly unitPrice: Money,
    private readonly quantity: Quantity,
  ) {}

  static create(
    productId: string,
    productName: string,
    unitPrice: Money,
    quantity: Quantity,
  ): OrderItem {
    return new OrderItem(
      OrderItemId.generate(),
      productId,
      productName,
      unitPrice,
      quantity,
    );
  }

  static reconstitute(
    id: OrderItemId,
    productId: string,
    productName: string,
    unitPrice: Money,
    quantity: Quantity,
  ): OrderItem {
    return new OrderItem(id, productId, productName, unitPrice, quantity);
  }

  getLineTotal(): Money {
    return this.unitPrice.multiply(this.quantity.getValue());
  }

  getOrderItemId(): OrderItemId {
    return this.id;
  }

  getProductId(): string {
    return this.productId;
  }

  getProductName(): string {
    return this.productName;
  }

  getUnitPrice(): Money {
    return this.unitPrice;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }
}
