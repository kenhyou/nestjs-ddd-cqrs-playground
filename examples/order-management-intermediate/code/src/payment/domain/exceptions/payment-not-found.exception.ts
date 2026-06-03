import {
  DomainErrorCategory,
  DomainException,
} from '@shared/exceptions/domain.exception';

export class PaymentNotFoundException extends DomainException {
  readonly category: DomainErrorCategory = 'NOT_FOUND';

  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
  }
}
