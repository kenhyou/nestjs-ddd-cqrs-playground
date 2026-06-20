import { PaymentFailedHandler } from '@order/application/events/handlers/payment-failed.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';

describe('PaymentFailedHandler', () => {
  let handler: PaymentFailedHandler;
  let sagaRepository: jest.Mocked<SagaRepositoryPort>;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;

  beforeEach(() => {
    sagaRepository = { findByOrderId: jest.fn(), save: jest.fn() };
    orderRepository = { findById: jest.fn(), save: jest.fn() };
    handler = new PaymentFailedHandler(sagaRepository, orderRepository);
  });

  const message = (orderId: string) => ({
    messageId: 'msg-1',
    messageType: 'PaymentFailed',
    payload: { orderId },
  });

  it('cancels the saga and the order, and records FAILED payment status', async () => {
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

    await handler.handle(message(orderId.getValue()));

    expect(sagaRepository.save).toHaveBeenCalledTimes(1);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(saga.getSagaStatus()).toBe(SagaStatus.CANCELLED);
    expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    expect(order.getPaymentStatus()).toBe('FAILED');
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
