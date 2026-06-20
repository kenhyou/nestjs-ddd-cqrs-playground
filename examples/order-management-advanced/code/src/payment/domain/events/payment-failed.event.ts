import { DomainEvent } from '@shared/domain/domain-event';

export class PaymentFailedEvent extends DomainEvent {
  readonly eventType = 'PaymentFailed';

  constructor(
    private readonly paymentId: string,
    private readonly orderId: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
    };
  }
}
