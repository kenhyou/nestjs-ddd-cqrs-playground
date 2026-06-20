import { Injectable } from '@nestjs/common';
import { PaymentGatewayPort } from '@payment/application/ports/payment-gateway.port';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';
import { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

@Injectable()
export class RequestPaymentHandler extends MessageHandler {
  readonly messageType = 'RequestPayment';

  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
  ) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { orderId, amount, currency } = message.payload as {
      orderId: string;
      amount: number;
      currency: string;
    };

    const payment = Payment.create(
      orderId,
      Money.create(amount, currency),
      PaymentMethod.CARD,
    );

    const outcome = await this.paymentGateway.charge({
      orderId,
      amount,
      currency,
    });
    if (outcome.settled) {
      payment.succeed(outcome.gatewayRef);
    } else {
      payment.fail();
    }
    await this.paymentRepository.save(payment);
  }
}
