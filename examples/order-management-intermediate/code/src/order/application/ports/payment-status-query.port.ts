export abstract class PaymentStatusQueryPort {
  abstract isPaid(orderId: string): Promise<boolean>;
}
