import { DomainEvent } from '@shared/domain/domain-event';

export class PaymentSucceededEvent extends DomainEvent {
  readonly eventType = 'PaymentSucceeded';

  constructor(
    private readonly paymentId: string,
    private readonly orderId: string,
    private readonly gatewayRef: string,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      gatewayRef: this.gatewayRef,
    };
  }
}
