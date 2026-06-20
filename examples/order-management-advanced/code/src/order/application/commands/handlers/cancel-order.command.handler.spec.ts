import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { CancelOrderCommandHandler } from '@order/application/commands/handlers/cancel-order.command.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { OrderCancelledEvent } from '@order/domain/events/order-cancelled.event';
import { RequestRefundEvent } from '@order/domain/events/request-refund.event';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';

describe('CancelOrderCommandHandler', () => {
  let handler: CancelOrderCommandHandler;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;
  let sagaRepository: jest.Mocked<SagaRepositoryPort>;

  beforeEach(() => {
    orderRepository = { findById: jest.fn(), save: jest.fn() };
    sagaRepository = { findByOrderId: jest.fn(), save: jest.fn() };
    handler = new CancelOrderCommandHandler(orderRepository, sagaRepository);
  });

  const buildOrder = (orderId: OrderId, status: OrderStatus) =>
    Order.reconstitute(orderId, 'cust-1', status, Money.create(100, 'USD'), []);

  it('cancels the order and the saga before payment settles (no refund)', async () => {
    const orderId = OrderId.generate();
    const order = buildOrder(orderId, OrderStatus.CONFIRMED);
    const saga = FulfillmentSaga.reconstitute(
      orderId,
      SagaStatus.AWAITING_PAYMENT,
      null,
      null,
    );
    orderRepository.findById.mockResolvedValue(order);
    sagaRepository.findByOrderId.mockResolvedValue(saga);

    await handler.execute(new CancelOrderCommand(orderId.getValue()));

    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(sagaRepository.save).toHaveBeenCalledTimes(1);

    const savedOrder = orderRepository.save.mock.calls[0][0];
    expect(savedOrder.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    expect(savedOrder.pullEvents()[0]).toBeInstanceOf(OrderCancelledEvent);

    const savedSaga = sagaRepository.save.mock.calls[0][0];
    expect(savedSaga.getSagaStatus()).toBe(SagaStatus.CANCELLED);
    expect(savedSaga.pullEvents()).toHaveLength(0);
  });

  it('cancels the order and starts compensation after payment settled', async () => {
    const orderId = OrderId.generate();
    const order = buildOrder(orderId, OrderStatus.PENDING_SHIPMENT);
    const saga = FulfillmentSaga.reconstitute(
      orderId,
      SagaStatus.AWAITING_SHIPMENT,
      'pay-1',
      null,
    );
    orderRepository.findById.mockResolvedValue(order);
    sagaRepository.findByOrderId.mockResolvedValue(saga);

    await handler.execute(new CancelOrderCommand(orderId.getValue()));

    const savedOrder = orderRepository.save.mock.calls[0][0];
    expect(savedOrder.getOrderStatus()).toBe(OrderStatus.CANCELLED);

    const savedSaga = sagaRepository.save.mock.calls[0][0];
    expect(savedSaga.getSagaStatus()).toBe(SagaStatus.COMPENSATING);
    expect(savedSaga.pullEvents().at(-1)).toBeInstanceOf(RequestRefundEvent);
  });

  it('cancels a still-pending order that has no saga', async () => {
    const orderId = OrderId.generate();
    const order = buildOrder(orderId, OrderStatus.PENDING);
    orderRepository.findById.mockResolvedValue(order);
    sagaRepository.findByOrderId.mockResolvedValue(null);

    await handler.execute(new CancelOrderCommand(orderId.getValue()));

    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(sagaRepository.save).not.toHaveBeenCalled();
    expect(orderRepository.save.mock.calls[0][0].getOrderStatus()).toBe(
      OrderStatus.CANCELLED,
    );
  });

  it('throws and saves nothing if the order is not found', async () => {
    orderRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new CancelOrderCommand(OrderId.generate().getValue())),
    ).rejects.toThrow();

    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(sagaRepository.save).not.toHaveBeenCalled();
  });

  it('throws and does not touch the saga if the order already shipped', async () => {
    const orderId = OrderId.generate();
    const order = buildOrder(orderId, OrderStatus.SHIPPED);
    orderRepository.findById.mockResolvedValue(order);

    await expect(
      handler.execute(new CancelOrderCommand(orderId.getValue())),
    ).rejects.toThrow();

    expect(sagaRepository.findByOrderId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(sagaRepository.save).not.toHaveBeenCalled();
  });
});
