import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { RequestPaymentEvent } from '@order/domain/events/request-payment.event';
import { RequestRefundEvent } from '@order/domain/events/request-refund.event';
import { RequestShipmentEvent } from '@order/domain/events/request-shipment.event';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { AggregateRoot } from '@shared/domain/aggregate-root';

export class FulfillmentSaga extends AggregateRoot {
  // How long the saga may sit in an AWAITING_* step before the timeout Scheduler
  // compensates it. Constant for this learning scope; would be config in prod.
  private static readonly STEP_TIMEOUT_MS = 30_000;

  private constructor(
    private readonly orderId: OrderId,
    private status: SagaStatus,
    private paymentId: string | null = null,
    private shipmentId: string | null = null,
    // Deadline for the current AWAITING_* step; null when not awaiting.
    private awaitingUntil: Date | null = null,
  ) {
    super();
  }

  static start(
    orderId: OrderId,
    amount: number,
    currency: string,
  ): FulfillmentSaga {
    const saga = new FulfillmentSaga(orderId, SagaStatus.AWAITING_PAYMENT);
    saga.awaitingUntil = saga.nextDeadline();

    saga.record(new RequestPaymentEvent(orderId.getValue(), amount, currency));

    return saga;
  }

  static reconstitute(
    orderId: OrderId,
    status: SagaStatus,
    paymentId: string | null,
    shipmentId: string | null,
    awaitingUntil: Date | null = null,
  ): FulfillmentSaga {
    return new FulfillmentSaga(
      orderId,
      status,
      paymentId,
      shipmentId,
      awaitingUntil,
    );
  }

  onPaymentSucceeded(paymentId: string): void {
    if (this.status !== SagaStatus.AWAITING_PAYMENT) {
      return;
    }
    this.paymentId = paymentId;
    this.status = SagaStatus.AWAITING_SHIPMENT;
    this.awaitingUntil = this.nextDeadline();

    this.record(new RequestShipmentEvent(this.orderId.getValue()));
  }

  onPaymentFailed(): void {
    if (this.status !== SagaStatus.AWAITING_PAYMENT) {
      return;
    }
    this.status = SagaStatus.CANCELLED;
    this.awaitingUntil = null;
  }

  onShipmentDispatched(shipmentId: string): void {
    if (this.status !== SagaStatus.AWAITING_SHIPMENT) return;

    this.shipmentId = shipmentId;
  }

  onShipmentDelivered(): void {
    if (this.status !== SagaStatus.AWAITING_SHIPMENT) return;

    this.status = SagaStatus.COMPLETED;
    this.awaitingUntil = null;
  }

  onShipmentFailed(): void {
    if (this.status !== SagaStatus.AWAITING_SHIPMENT) return;

    this.status = SagaStatus.COMPENSATING;
    this.awaitingUntil = null;

    this.record(new RequestRefundEvent(this.paymentId!));
  }

  onRefundIssued(): void {
    if (this.status !== SagaStatus.COMPENSATING) return;

    this.status = SagaStatus.CANCELLED;
  }

  onTimeout(): void {
    this.cancelOrCompensate();
  }

  onCancelRequested(): void {
    this.cancelOrCompensate();
  }

  private cancelOrCompensate(): void {
    if (this.status === SagaStatus.AWAITING_PAYMENT) {
      this.status = SagaStatus.CANCELLED;
      this.awaitingUntil = null;
    } else if (this.status === SagaStatus.AWAITING_SHIPMENT) {
      this.status = SagaStatus.COMPENSATING;
      this.awaitingUntil = null;

      this.record(new RequestRefundEvent(this.paymentId!));
    }
  }

  private nextDeadline(): Date {
    return new Date(Date.now() + FulfillmentSaga.STEP_TIMEOUT_MS);
  }

  getOrderId(): OrderId {
    return this.orderId;
  }

  getSagaStatus(): SagaStatus {
    return this.status;
  }

  getPaymentId(): string | null {
    return this.paymentId;
  }

  getShipmentId(): string | null {
    return this.shipmentId;
  }

  getAwaitingUntil(): Date | null {
    return this.awaitingUntil;
  }
}
