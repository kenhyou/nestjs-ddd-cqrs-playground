import { Injectable } from '@nestjs/common';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

@Injectable()
export class StartSagaHandler extends MessageHandler {
  readonly messageType = 'OrderConfirmed';

  constructor(private readonly sagaRepository: SagaRepositoryPort) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { orderId, totalPrice, currency } = message.payload as {
      orderId: string;
      totalPrice: number;
      currency: string;
    };

    const saga = FulfillmentSaga.start(
      OrderId.create(orderId),
      totalPrice,
      currency,
    );

    await this.sagaRepository.save(saga);
  }
}
