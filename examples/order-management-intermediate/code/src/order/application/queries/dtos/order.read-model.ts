export class OrderReadModel {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly status: string,
    public readonly items: OrderItemReadModel[],
    public readonly totalAmount: number,
    public readonly currency: string,
  ) {}
}

export class OrderItemReadModel {
  constructor(
    public readonly orderItemId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly unitPrice: number,
  ) {}
}
