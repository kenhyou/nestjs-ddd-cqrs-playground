import { AggregateRoot } from '@shared/domain/aggregate-root';
import { Money } from '@payment/domain/vo/money.vo';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { InvalidPaymentStateException } from '@payment/domain/exceptions/payment.exceptions';
import { PaymentRequestedEvent } from '@payment/domain/events/payment-requested.event';
import { PaymentSucceededEvent } from '@payment/domain/events/payment-succeeded.event';
import { PaymentFailedEvent } from '@payment/domain/events/payment-failed.event';
import { RefundIssuedEvent } from '@payment/domain/events/refund-issued.event';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';

export class Payment extends AggregateRoot {
  private gatewayRef: string | null = null;

  private constructor(
    private readonly paymentId: PaymentId,
    private readonly orderId: string,
    private readonly amount: Money,
    private readonly method: PaymentMethod,
    private status: PaymentStatus,
  ) {
    super();
  }

  static create(
    orderId: string,
    amount: Money,
    method: PaymentMethod,
  ): Payment {
    const paymentId = PaymentId.generate();

    const payment = new Payment(
      paymentId,
      orderId,
      amount,
      method,
      PaymentStatus.REQUESTED,
    );

    payment.record(
      new PaymentRequestedEvent(
        paymentId.getValue(),
        orderId,
        amount.getAmount(),
        amount.getCurrency(),
      ),
    );

    return payment;
  }

  static reconstitute(
    paymentId: PaymentId,
    orderId: string,
    amount: Money,
    method: PaymentMethod,
    status: PaymentStatus,
    gatewayRef: string | null,
  ): Payment {
    const payment = new Payment(paymentId, orderId, amount, method, status);

    if (gatewayRef) {
      payment.gatewayRef = gatewayRef;
    }

    return payment;
  }

  succeed(gatewayRef: string): void {
    if (this.status !== PaymentStatus.REQUESTED) {
      throw new InvalidPaymentStateException('Payment is not in requested state');
    }

    this.status = PaymentStatus.SUCCEEDED;
    this.gatewayRef = gatewayRef;

    this.record(
      new PaymentSucceededEvent(
        this.paymentId.getValue(),
        this.orderId,
        gatewayRef,
      ),
    );
  }

  fail(): void {
    if (this.status !== PaymentStatus.REQUESTED) {
      throw new InvalidPaymentStateException('Payment is not in requested state');
    }

    this.status = PaymentStatus.FAILED;

    this.record(
      new PaymentFailedEvent(this.paymentId.getValue(), this.orderId),
    );
  }

  refund(): void {
    if (this.status !== PaymentStatus.SUCCEEDED) {
      throw new InvalidPaymentStateException('Payment is not in succeeded state');
    }

    this.status = PaymentStatus.REFUNDED;

    this.record(new RefundIssuedEvent(this.paymentId.getValue(), this.orderId));
  }

  getPaymentId(): PaymentId {
    return this.paymentId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }

  getPaymentStatus(): PaymentStatus {
    return this.status;
  }

  getGatewayRef(): string | null {
    return this.gatewayRef;
  }
}
