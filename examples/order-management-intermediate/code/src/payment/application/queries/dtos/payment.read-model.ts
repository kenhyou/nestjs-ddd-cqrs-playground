export class PaymentReadModel {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly method: string,
    public readonly status: string,
  ) {}
}
