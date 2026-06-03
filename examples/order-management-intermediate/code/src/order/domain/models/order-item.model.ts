import { Money } from '@order/domain/vo/money.vo';
import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

export class OrderItem {
  private constructor(
    private readonly orderItemId: OrderItemId,
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
    if (productId.trim().length < 1) {
      throw new Error('Product ID must not be empty.');
    }

    if (productName.trim().length < 1) {
      throw new Error('Product name must not be empty.');
    }

    const itemId: OrderItemId = OrderItemId.generate();

    return new OrderItem(itemId, productId, productName, unitPrice, quantity);
  }

  static reconstitute(
    orderItemId: OrderItemId,
    productId: string,
    productName: string,
    unitPrice: Money,
    quantity: Quantity,
  ): OrderItem {
    return new OrderItem(
      orderItemId,
      productId,
      productName,
      unitPrice,
      quantity,
    );
  }

  getTotalPrice(): Money {
    return this.unitPrice.multiply(this.quantity.getValue());
  }

  getOrderItemId(): OrderItemId {
    return this.orderItemId;
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
