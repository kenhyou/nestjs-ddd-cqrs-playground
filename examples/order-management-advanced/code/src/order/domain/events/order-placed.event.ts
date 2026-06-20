import { DomainEvent } from '@shared/domain/domain-event';

export class OrderPlacedEvent extends DomainEvent {
  readonly eventType = 'OrderPlaced';

  constructor(private readonly orderId: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
    };
  }
}
