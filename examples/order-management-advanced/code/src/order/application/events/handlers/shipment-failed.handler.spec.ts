import { ShipmentFailedHandler } from '@order/application/events/handlers/shipment-failed.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { RequestRefundEvent } from '@order/domain/events/request-refund.event';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';

describe('ShipmentFailedHandler', () => {
  let handler: ShipmentFailedHandler;
  let sagaRepository: jest.Mocked<SagaRepositoryPort>;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;

  beforeEach(() => {
    sagaRepository = { findByOrderId: jest.fn(), save: jest.fn() };
    orderRepository = { findById: jest.fn(), save: jest.fn() };
    handler = new ShipmentFailedHandler(sagaRepository, orderRepository);
  });

  const message = (orderId: string) => ({
    messageId: 'msg-1',
    messageType: 'ShipmentFailed',
    payload: { orderId, shipmentId: 'ship-1' },
  });

  it('starts compensation, requests a refund, and records FAILED shipment status', async () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.reconstitute(
      orderId,
      SagaStatus.AWAITING_SHIPMENT,
      'pay-1',
      'ship-1',
    );
    const order = Order.reconstitute(
      orderId,
      'cust-1',
      OrderStatus.PENDING_SHIPMENT,
      Money.create(100, 'USD'),
      [],
    );
    sagaRepository.findByOrderId.mockResolvedValue(saga);
    orderRepository.findById.mockResolvedValue(order);

    await handler.handle(message(orderId.getValue()));

    expect(saga.getSagaStatus()).toBe(SagaStatus.COMPENSATING);
    const events = saga.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(RequestRefundEvent);
    expect(events[0].payload()).toEqual({ paymentId: 'pay-1' });

    // Order is not cancelled here (RefundIssuedHandler does that) — only projected.
    expect(order.getShipmentStatus()).toBe('FAILED');
    expect(order.getOrderStatus()).toBe(OrderStatus.PENDING_SHIPMENT);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('throws if the saga is not found', async () => {
    sagaRepository.findByOrderId.mockResolvedValue(null);

    await expect(
      handler.handle(message(OrderId.generate().getValue())),
    ).rejects.toThrow();

    expect(sagaRepository.save).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
