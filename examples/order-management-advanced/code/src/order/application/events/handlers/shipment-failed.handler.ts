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
export class ShipmentFailedHandler extends MessageHandler {
  readonly messageType = 'ShipmentFailed';

  constructor(
    private readonly sagaRepository: SagaRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
  ) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { orderId } = message.payload as { orderId: string };
    const id = OrderId.create(orderId);

    const saga = await this.sagaRepository.findByOrderId(id);
    if (!saga) {
      throw new SagaNotFoundException(orderId);
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    // Saga starts compensation (→ RequestRefund); the Order is cancelled later
    // by RefundIssuedHandler. Here we only project the failed shipment leg.
    saga.onShipmentFailed();
    order.recordShipmentStatus('FAILED');

    await this.sagaRepository.save(saga);
    await this.orderRepository.save(order);
  }
}
