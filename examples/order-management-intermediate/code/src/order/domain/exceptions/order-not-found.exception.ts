import {
  DomainErrorCategory,
  DomainException,
} from '@shared/exceptions/domain.exception';

export class OrderNotFoundException extends DomainException {
  readonly category: DomainErrorCategory = 'NOT_FOUND';

  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
  }
}
