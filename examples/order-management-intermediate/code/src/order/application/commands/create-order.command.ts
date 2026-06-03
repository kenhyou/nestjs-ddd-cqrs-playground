export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: {
      productId: string;
      productName: string;
      unitPrice: number;
      currency: string;
      quantity: number;
    }[],
  ) {}
}
