import { Payment } from '@payment/domain/models/payment.model';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';

export abstract class PaymentRepositoryPort {
  abstract save(payment: Payment): Promise<void>;
  abstract findById(paymentId: PaymentId): Promise<Payment | null>;
}
