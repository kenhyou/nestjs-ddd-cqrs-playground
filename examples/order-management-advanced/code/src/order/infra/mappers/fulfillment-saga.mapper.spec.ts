import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { FulfillmentSagaMapper } from '@order/infra/mappers/fulfillment-saga.mapper';

describe('FulfillmentSagaMapper', () => {
  it('round-trips saga state, correlation ids, and the step deadline', () => {
    const orderId = OrderId.generate();
    const awaitingUntil = new Date('2026-06-20T00:00:00.000Z');
    const saga = FulfillmentSaga.reconstitute(
      orderId,
      SagaStatus.AWAITING_SHIPMENT,
      'pay-1',
      'ship-1',
      awaitingUntil,
    );

    const restored = FulfillmentSagaMapper.toDomain(
      FulfillmentSagaMapper.toEntity(saga),
    );

    expect(restored.getOrderId().equals(orderId)).toBe(true);
    expect(restored.getSagaStatus()).toBe(SagaStatus.AWAITING_SHIPMENT);
    expect(restored.getPaymentId()).toBe('pay-1');
    expect(restored.getShipmentId()).toBe('ship-1');
    expect(restored.getAwaitingUntil()).toEqual(awaitingUntil);
  });
});
