import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';

export abstract class PaymentQueryPort {
  abstract findById(paymentId: string): Promise<PaymentReadModel | null>;
}
