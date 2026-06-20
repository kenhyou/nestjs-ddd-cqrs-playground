import { Injectable } from '@nestjs/common';
import { PaymentGatewayPort } from '@payment/application/ports/payment-gateway.port';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exceptions';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

@Injectable()
export class RequestRefundHandler extends MessageHandler {
  readonly messageType = 'RequestRefund';

  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
  ) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { paymentId } = message.payload as { paymentId: string };

    const payment = await this.paymentRepository.findById(
      PaymentId.create(paymentId),
    );
    if (!payment) {
      throw new PaymentNotFoundException(paymentId);
    }

    const gatewayRef = payment.getGatewayRef();
    if (!gatewayRef) {
      throw new Error(`Payment ${paymentId} has no gatewayRef to refund`);
    }

    const outcome = await this.paymentGateway.refund({ gatewayRef });
    if (!outcome.refunded) {
      // A failed refund must not be swallowed: leaving it would strand the saga in
      // COMPENSATING with the customer's money unreturned. Throw so it retries.
      throw new Error(`Refund failed for payment ${paymentId}`);
    }

    payment.refund();

    await this.paymentRepository.save(payment);
  }
}
