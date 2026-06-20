import { DomainEvent } from '@shared/domain/domain-event';

export class PaymentRequestedEvent extends DomainEvent {
  readonly eventType = 'PaymentRequested';

  constructor(
    private readonly paymentId: string,
    private readonly orderId: string,
    private readonly amount: number,
    private readonly currency: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      amount: this.amount,
      currency: this.currency,
    };
  }
}
