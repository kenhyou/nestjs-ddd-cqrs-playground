import { DomainEvent } from '@shared/domain/domain-event';

export class RequestPaymentEvent extends DomainEvent {
  readonly eventType = 'RequestPayment';

  constructor(
    private readonly orderId: string,
    private readonly amount: number,
    private readonly currency: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      amount: this.amount,
      currency: this.currency,
    };
  }
}
