import { DomainEvent } from '@shared/domain/domain-event';

export class ShipmentDeliveredEvent extends DomainEvent {
  readonly eventType = 'ShipmentDelivered';

  constructor(
    private readonly shipmentId: string,
    private readonly orderId: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      shipmentId: this.shipmentId,
      orderId: this.orderId,
    };
  }
}
