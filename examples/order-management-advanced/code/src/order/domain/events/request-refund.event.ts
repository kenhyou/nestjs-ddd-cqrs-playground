import { DomainEvent } from '@shared/domain/domain-event';

export class RequestRefundEvent extends DomainEvent {
  readonly eventType = 'RequestRefund';

  constructor(private readonly paymentId: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      paymentId: this.paymentId,
    };
  }
}
