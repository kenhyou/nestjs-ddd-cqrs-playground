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
export class ShipmentDispatchedHandler extends MessageHandler {
  readonly messageType = 'ShipmentDispatched';

  constructor(
    private readonly sagaRepository: SagaRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
  ) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { orderId, shipmentId } = message.payload as {
      orderId: string;
      shipmentId: string;
    };
    const id = OrderId.create(orderId);

    const saga = await this.sagaRepository.findByOrderId(id);
    if (!saga) {
      throw new SagaNotFoundException(orderId);
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    saga.onShipmentDispatched(shipmentId);
    order.ship();
    order.recordShipmentStatus('DISPATCHED');

    await this.sagaRepository.save(saga);
    await this.orderRepository.save(order);
  }
}
