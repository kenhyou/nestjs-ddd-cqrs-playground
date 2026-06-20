import { DomainEvent } from '@shared/domain/domain-event';

export class RefundIssuedEvent extends DomainEvent {
  readonly eventType = 'RefundIssued';

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
