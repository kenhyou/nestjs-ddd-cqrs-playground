import { DomainEvent } from '@shared/domain/domain-event';

export class OrderCancelledEvent extends DomainEvent {
  readonly eventType = 'OrderCancelled';

  constructor(private readonly orderId: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
    };
  }
}
