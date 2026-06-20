import { DomainEvent } from '@shared/domain/domain-event';

export class ShipmentDispatchedEvent extends DomainEvent {
  readonly eventType = 'ShipmentDispatched';

  constructor(
    private readonly shipmentId: string,
    private readonly orderId: string,
    private readonly trackingCode: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      shipmentId: this.shipmentId,
      orderId: this.orderId,
      trackingCode: this.trackingCode,
    };
  }
}
