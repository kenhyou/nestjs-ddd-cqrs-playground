import { PaymentSucceededHandler } from '@order/application/events/handlers/payment-succeeded.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { RequestShipmentEvent } from '@order/domain/events/request-shipment.event';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';

describe('PaymentSucceededHandler', () => {
  let handler: PaymentSucceededHandler;
  let sagaRepository: jest.Mocked<SagaRepositoryPort>;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;

  beforeEach(() => {
    sagaRepository = { findByOrderId: jest.fn(), save: jest.fn() };
    orderRepository = { findById: jest.fn(), save: jest.fn() };
    handler = new PaymentSucceededHandler(sagaRepository, orderRepository);
  });

  const message = (orderId: OrderId) => ({
    messageId: 'msg-1',
    messageType: 'PaymentSucceeded',
    payload: { paymentId: 'pay-1', orderId: orderId.getValue(), gatewayRef: 'gw-1' },
  });

  it('advances the saga and marks the order pending shipment', async () => {
    const orderId = OrderId.generate();
    const saga = FulfillmentSaga.reconstitute(
      orderId,
      SagaStatus.AWAITING_PAYMENT,
      null,
      null,
    );
    const order = Order.reconstitute(
      orderId,
      'cust-1',
      OrderStatus.CONFIRMED,
      Money.create(100, 'USD'),
      [],
    );
    sagaRepository.findByOrderId.mockResolvedValue(saga);
    orderRepository.findById.mockResolvedValue(order);

    await handler.handle(message(orderId));

    expect(sagaRepository.save).toHaveBeenCalledTimes(1);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);

    const savedSaga = sagaRepository.save.mock.calls[0][0];
    expect(savedSaga.getSagaStatus()).toBe(SagaStatus.AWAITING_SHIPMENT);
    expect(savedSaga.getPaymentId()).toBe('pay-1');
    expect(savedSaga.pullEvents()[0]).toBeInstanceOf(RequestShipmentEvent);

    const savedOrder = orderRepository.save.mock.calls[0][0];
    expect(savedOrder.getOrderStatus()).toBe(OrderStatus.PENDING_SHIPMENT);
  });

  it('throws and saves nothing if the saga is not found', async () => {
    const orderId = OrderId.generate();
    sagaRepository.findByOrderId.mockResolvedValue(null);

    await expect(handler.handle(message(orderId))).rejects.toThrow();

    expect(sagaRepository.save).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
