import { ShipmentDeliveredHandler } from '@order/application/events/handlers/shipment-delivered.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { OrderDeliveredEvent } from '@order/domain/events/order-delivered.event';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';

describe('ShipmentDeliveredHandler', () => {
  let handler: ShipmentDeliveredHandler;
  let sagaRepository: jest.Mocked<SagaRepositoryPort>;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;

  beforeEach(() => {
    sagaRepository = { findByOrderId: jest.fn(), save: jest.fn() };
    orderRepository = { findById: jest.fn(), save: jest.fn() };
    handler = new ShipmentDeliveredHandler(sagaRepository, orderRepository);
  });

  const message = (orderId: OrderId) => ({
    messageId: 'msg-1',
    messageType: 'ShipmentDelivered',
    payload: { orderId: orderId.getValue(), shipmentId: 'ship-1' },
  });

  it('completes the saga and delivers the order', async () => {
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
      OrderStatus.SHIPPED,
      Money.create(100, 'USD'),
      [],
    );
    sagaRepository.findByOrderId.mockResolvedValue(saga);
    orderRepository.findById.mockResolvedValue(order);

    await handler.handle(message(orderId));

    expect(sagaRepository.save).toHaveBeenCalledTimes(1);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);

    const savedSaga = sagaRepository.save.mock.calls[0][0];
    expect(savedSaga.getSagaStatus()).toBe(SagaStatus.COMPLETED);
    expect(savedSaga.pullEvents()).toHaveLength(0);

    const savedOrder = orderRepository.save.mock.calls[0][0];
    expect(savedOrder.getOrderStatus()).toBe(OrderStatus.DELIVERED);
    expect(savedOrder.pullEvents()[0]).toBeInstanceOf(OrderDeliveredEvent);
  });

  it('throws and saves nothing if the saga is not found', async () => {
    const orderId = OrderId.generate();
    sagaRepository.findByOrderId.mockResolvedValue(null);

    await expect(handler.handle(message(orderId))).rejects.toThrow();

    expect(sagaRepository.save).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
