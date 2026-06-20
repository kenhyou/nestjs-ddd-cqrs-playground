import { DomainEvent } from '@shared/domain/domain-event';

export class OrderShippedEvent extends DomainEvent {
  readonly eventType = 'OrderShipped';

  constructor(private readonly orderId: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
    };
  }
}
