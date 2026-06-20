import { DomainEvent } from '@shared/domain/domain-event';

export class OrderConfirmedEvent extends DomainEvent {
  readonly eventType = 'OrderConfirmed';

  constructor(
    private readonly orderId: string,
    private readonly totalPrice: number,
    private readonly currency: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      totalPrice: this.totalPrice,
      currency: this.currency,
    };
  }
}
