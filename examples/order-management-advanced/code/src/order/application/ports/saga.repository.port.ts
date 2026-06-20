import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { OrderId } from '@order/domain/vo/order-id.vo';

export abstract class SagaRepositoryPort {
  abstract save(saga: FulfillmentSaga): Promise<void>;
  abstract findByOrderId(orderId: OrderId): Promise<FulfillmentSaga | null>;
}
