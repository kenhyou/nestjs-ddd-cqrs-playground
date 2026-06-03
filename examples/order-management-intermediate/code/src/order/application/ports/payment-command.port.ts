export abstract class PaymentCommandPort {
  abstract createPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: string,
  ): Promise<void>;
}
