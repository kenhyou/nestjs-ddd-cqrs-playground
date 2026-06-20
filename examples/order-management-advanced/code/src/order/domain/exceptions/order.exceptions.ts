import {
  DomainException,
  DomainExceptionCategory,
} from '@shared/exceptions/domain-exception';

export class OrderNotFoundException extends DomainException {
  readonly category = DomainExceptionCategory.NOT_FOUND;

  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
  }
}

export class SagaNotFoundException extends DomainException {
  readonly category = DomainExceptionCategory.NOT_FOUND;

  constructor(orderId: string) {
    super(`Saga not found for order ${orderId}`);
  }
}

export class InvalidOrderStateException extends DomainException {
  readonly category = DomainExceptionCategory.CONFLICT;

  constructor(message: string) {
    super(message);
  }
}

export class OrderNotCancellableException extends DomainException {
  readonly category = DomainExceptionCategory.CONFLICT;

  constructor(message = 'Order can be cancelled only before it ships.') {
    super(message);
  }
}
