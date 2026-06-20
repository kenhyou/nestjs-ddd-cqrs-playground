import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { RequestPaymentEvent } from '@order/domain/events/request-payment.event';
import { RequestRefundEvent } from '@order/domain/events/request-refund.event';
import { RequestShipmentEvent } from '@order/domain/events/request-shipment.event';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { OrderId } from '@order/domain/vo/order-id.vo';

const buildAwaitingShipmentSaga = () => {
  const orderId = OrderId.generate();
  const saga = FulfillmentSaga.start(orderId, 100, 'USD');
  saga.onPaymentSucceeded('pay_123');

  return saga;
};

const buildCompensationSaga = () => {
  const saga = buildAwaitingShipmentSaga();
  saga.onShipmentFailed();

  return saga;
};

describe('FulfillmentSaga', () => {
  it('should start a new saga successfully', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    expect(saga.getOrderId()).toBe(orderId);
    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);

    const events = saga.pullEvents();
    expect(events.length).toBe(1);
    expect(events.at(-1)).toBeInstanceOf(RequestPaymentEvent);
    expect(events.at(-1)?.payload()).toEqual({
      amount: 100,
      currency: 'USD',
      orderId: orderId.getValue(),
    });
  });

  it('successfully reconstitute saga from state', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.reconstitute(
      orderId,
      SagaStatus.AWAITING_PAYMENT,
      'pay-1',
      'ship-1',
    );

    expect(saga.getOrderId()).toBe(orderId);
    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);
    expect(saga.getPaymentId()).toBe('pay-1');
    expect(saga.getShipmentId()).toBe('ship-1');
    expect(saga.pullEvents().length).toBe(0);
  });

  it('successfully transition to awaiting shipment when payment succeeds', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');
    saga.onPaymentSucceeded('pay_123');

    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_SHIPMENT);
    expect(saga.getPaymentId()).toBe('pay_123');

    const events = saga.pullEvents();
    expect(events.length).toBe(2);
    expect(events.at(-1)).toBeInstanceOf(RequestShipmentEvent);
  });

  it('silently ignores duplicated payment success events', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');
    saga.onPaymentSucceeded('pay_123');

    const events = saga.pullEvents();
    expect(events.length).toBe(2);
    expect(events.at(-1)).toBeInstanceOf(RequestShipmentEvent);

    saga.onPaymentSucceeded('pay_123');

    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_SHIPMENT);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('cancels saga when payment fails', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();

    saga.onPaymentFailed();

    expect(saga.getSagaStatus()).toBe(SagaStatus.CANCELLED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('silently ignores payment failed events after payment succeeded', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');
    saga.onPaymentSucceeded('pay_123');

    const events = saga.pullEvents();
    expect(events.length).toBe(2);
    expect(events.at(-1)).toBeInstanceOf(RequestShipmentEvent);

    saga.onPaymentFailed();

    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_SHIPMENT);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('successfully saves shipment id on shipment dispatched event', () => {
    const saga = buildAwaitingShipmentSaga();
    saga.pullEvents();

    saga.onShipmentDispatched('ship-123');

    expect(saga.getShipmentId()).toBe('ship-123');
    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_SHIPMENT);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('successfully transitions to completed when shipment is delivered', () => {
    const saga = buildAwaitingShipmentSaga();
    saga.pullEvents();

    saga.onShipmentDispatched('ship-123');
    saga.onShipmentDelivered();

    expect(saga.getShipmentId()).toBe('ship-123');
    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPLETED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('silently ignores shipment delivered events while still awaiting payment', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();

    saga.onShipmentDelivered();
    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('silently ignores shipment dispatched event in completed status', () => {
    const saga = buildAwaitingShipmentSaga();
    saga.onShipmentDispatched('ship-123');
    saga.onShipmentDelivered();
    saga.pullEvents();

    saga.onShipmentDispatched('ship-456');

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPLETED);
    expect(saga.pullEvents().length).toBe(0);

    saga.onShipmentDispatched('ship-456');
    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPLETED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('transitions to compensating status if shipment failed events arise', () => {
    const saga = buildAwaitingShipmentSaga();
    saga.pullEvents();

    saga.onShipmentFailed();

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPENSATING);
    expect(saga.pullEvents().at(-1)).toBeInstanceOf(RequestRefundEvent);
  });

  it('silently ignores shipment failed events while still awaiting payment', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();

    saga.onShipmentFailed();
    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('successfully transitions to cancelled status if refund is issued', () => {
    const saga = buildCompensationSaga();

    saga.pullEvents();

    saga.onRefundIssued();

    expect(saga.getSagaStatus()).toBe(SagaStatus.CANCELLED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('silently ignores refund issued events while still awaiting payment', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();

    saga.onRefundIssued();

    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('cancels saga if payment timout', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();

    saga.onTimeout();

    expect(saga.getSagaStatus()).toBe(SagaStatus.CANCELLED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('transitions to compensating state if shipment times out', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();
    saga.onPaymentSucceeded('pay_123');

    saga.pullEvents();

    saga.onTimeout();

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPENSATING);
    expect(saga.pullEvents().at(-1)).toBeInstanceOf(RequestRefundEvent);
  });

  it('silently ignores timeout event if it is in completed state', () => {
    const saga = buildAwaitingShipmentSaga();
    saga.onShipmentDelivered();

    saga.pullEvents();

    saga.onTimeout();

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPLETED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('cancels the saga on cancel request while awaiting payment', () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.start(orderId, 100, 'USD');

    saga.pullEvents();

    saga.onCancelRequested();

    expect(saga.getSagaStatus()).toBe(SagaStatus.CANCELLED);
    expect(saga.pullEvents().length).toBe(0);
  });

  it('compensates on cancel request after payment settled', () => {
    const saga = buildAwaitingShipmentSaga();

    saga.pullEvents();

    saga.onCancelRequested();

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPENSATING);
    expect(saga.pullEvents().at(-1)).toBeInstanceOf(RequestRefundEvent);
  });

  it('silently ignores cancel request in a terminal state', () => {
    const saga = buildAwaitingShipmentSaga();
    saga.onShipmentDelivered();

    saga.pullEvents();

    saga.onCancelRequested();

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPLETED);
    expect(saga.pullEvents().length).toBe(0);
  });
});
