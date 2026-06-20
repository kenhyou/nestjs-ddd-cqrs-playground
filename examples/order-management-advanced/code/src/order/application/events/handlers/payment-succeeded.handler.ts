import { Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import {
  OrderNotFoundException,
  SagaNotFoundException,
} from '@order/domain/exceptions/order.exceptions';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

@Injectable()
export class PaymentSucceededHandler extends MessageHandler {
  readonly messageType = 'PaymentSucceeded';

  constructor(
    private readonly sagaRepository: SagaRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
  ) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { paymentId, orderId } = message.payload as {
      paymentId: string;
      orderId: string;
    };

    const saga = await this.sagaRepository.findByOrderId(
      OrderId.create(orderId),
    );
    if (!saga) {
      throw new SagaNotFoundException(orderId);
    }

    const order = await this.orderRepository.findById(OrderId.create(orderId));
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    saga.onPaymentSucceeded(paymentId);
    order.markPendingShipment();
    order.recordPaymentStatus('SUCCEEDED');

    await this.sagaRepository.save(saga);
    await this.orderRepository.save(order);
  }
}
