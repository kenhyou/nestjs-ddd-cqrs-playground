import { DomainEvent } from '@shared/domain/domain-event';

export class RequestShipmentEvent extends DomainEvent {
  readonly eventType = 'RequestShipment';

  constructor(private readonly orderId: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
    };
  }
}
