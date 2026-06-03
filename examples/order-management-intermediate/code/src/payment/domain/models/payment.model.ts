import { Money } from '@payment/domain/vo/money.vo';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { InvalidPaymentStateException } from '@payment/domain/exceptions/invalid-payment-state.exception';

export class Payment {
  private constructor(
    private readonly paymentId: PaymentId,
    private readonly orderId: string,
    private readonly amount: Money,
    private readonly method: PaymentMethod,
    private paymentStatus: PaymentStatus,
  ) {}

  static create(
    orderId: string,
    amount: Money,
    method: PaymentMethod,
  ): Payment {
    const paymentId = PaymentId.generate();

    return new Payment(
      paymentId,
      orderId,
      amount,
      method,
      PaymentStatus.REQUESTED,
    );
  }

  static reconstitute(
    paymentId: PaymentId,
    orderId: string,
    amount: Money,
    method: PaymentMethod,
    paymentStatus: PaymentStatus,
  ): Payment {
    return new Payment(paymentId, orderId, amount, method, paymentStatus);
  }

  succeed(): void {
    if (this.paymentStatus !== PaymentStatus.REQUESTED) {
      throw new InvalidPaymentStateException(
        'Payment must be REQUESTED to succeed.',
      );
    }
    this.paymentStatus = PaymentStatus.SUCCEEDED;
  }

  fail(): void {
    if (this.paymentStatus !== PaymentStatus.REQUESTED) {
      throw new InvalidPaymentStateException(
        'Payment must be REQUESTED to fail.',
      );
    }
    this.paymentStatus = PaymentStatus.FAILED;
  }

  refund(): void {
    if (this.paymentStatus !== PaymentStatus.SUCCEEDED) {
      throw new InvalidPaymentStateException(
        'Payment must be SUCCEEDED to refund.',
      );
    }
    this.paymentStatus = PaymentStatus.REFUNDED;
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
    return this.paymentStatus;
  }
}
