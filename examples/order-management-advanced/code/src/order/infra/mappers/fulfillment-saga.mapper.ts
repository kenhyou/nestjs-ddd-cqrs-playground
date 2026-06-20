import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { FulfillmentSagaEntity } from '@order/infra/entities/fulfillment-saga.entity';

export class FulfillmentSagaMapper {
  static toEntity(saga: FulfillmentSaga): FulfillmentSagaEntity {
    const entity = new FulfillmentSagaEntity();
    entity.orderId = saga.getOrderId().getValue();
    entity.status = saga.getSagaStatus();
    entity.paymentId = saga.getPaymentId();
    entity.shipmentId = saga.getShipmentId();
    entity.awaitingUntil = saga.getAwaitingUntil();
    return entity;
  }

  static toDomain(entity: FulfillmentSagaEntity): FulfillmentSaga {
    return FulfillmentSaga.reconstitute(
      OrderId.create(entity.orderId),
      entity.status as SagaStatus,
      entity.paymentId,
      entity.shipmentId,
      entity.awaitingUntil,
    );
  }
}
