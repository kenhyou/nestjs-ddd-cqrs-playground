import {
  DomainException,
  DomainExceptionCategory,
} from '@shared/exceptions/domain-exception';

export class PaymentNotFoundException extends DomainException {
  readonly category = DomainExceptionCategory.NOT_FOUND;

  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
  }
}

export class InvalidPaymentStateException extends DomainException {
  readonly category = DomainExceptionCategory.CONFLICT;

  constructor(message: string) {
    super(message);
  }
}
