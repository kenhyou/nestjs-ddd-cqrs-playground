export class AddOrderItemCommand {
  constructor(
    public readonly orderId: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly currency: string,
  ) {}
}
