import {
  DomainErrorCategory,
  DomainException,
} from '@shared/exceptions/domain.exception';

export class InvalidPaymentStateException extends DomainException {
  readonly category: DomainErrorCategory = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}
