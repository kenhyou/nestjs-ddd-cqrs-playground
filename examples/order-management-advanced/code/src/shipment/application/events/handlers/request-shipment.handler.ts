import { Injectable } from '@nestjs/common';
import { CarrierPort } from '@shipment/application/ports/carrier.port';
import { ShipmentRepositoryPort } from '@shipment/application/ports/shipment.repository.port';
import { Shipment } from '@shipment/domain/models/shipment.model';
import { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

@Injectable()
export class RequestShipmentHandler extends MessageHandler {
  readonly messageType = 'RequestShipment';

  constructor(
    private readonly shipmentRepository: ShipmentRepositoryPort,
    private readonly carrier: CarrierPort,
  ) {
    super();
  }

  async handle(message: InboundMessage): Promise<void> {
    const { orderId } = message.payload as { orderId: string };

    const shipment = Shipment.create(orderId);

    const outcome = await this.carrier.dispatch({ orderId });
    if (outcome.dispatched) {
      shipment.dispatch(outcome.trackingCode);
    } else {
      shipment.fail();
    }

    await this.shipmentRepository.save(shipment);
  }
}
