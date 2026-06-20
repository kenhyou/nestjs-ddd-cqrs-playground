import { DomainEvent } from '@shared/domain/domain-event';

export class OrderDeliveredEvent extends DomainEvent {
  readonly eventType = 'OrderDelivered';

  constructor(private readonly orderId: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
    };
  }
}
