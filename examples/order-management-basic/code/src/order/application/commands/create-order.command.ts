export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: {
      name: string;
      quantity: number;
      unitPrice: number;
      currency: string;
    }[],
  ) {}
}
