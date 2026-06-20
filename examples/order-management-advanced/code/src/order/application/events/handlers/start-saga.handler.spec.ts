import { StartSagaHandler } from '@order/application/events/handlers/start-saga.handler';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { RequestPaymentEvent } from '@order/domain/events/request-payment.event';
import { OrderId } from '@order/domain/vo/order-id.vo';

describe('StartSagaHandler', () => {
  let handler: StartSagaHandler;
  let repository: jest.Mocked<SagaRepositoryPort>;

  beforeEach(() => {
    repository = { save: jest.fn(), findByOrderId: jest.fn() };
    handler = new StartSagaHandler(repository);
  });

  it('successfully starts a saga', async () => {
    const orderId = OrderId.generate();
    const message = {
      messageId: 'msg-1',
      messageType: 'OrderConfirmed',
      payload: {
        orderId: orderId.getValue(),
        totalPrice: 100,
        currency: 'USD',
      },
    };

    await handler.handle(message);

    expect(repository.save).toHaveBeenCalledTimes(1);

    const saga = repository.save.mock.calls[0][0];
    expect(saga.getOrderId().getValue()).toBe(orderId.getValue());
    expect(saga.getSagaStatus()).toBe(SagaStatus.AWAITING_PAYMENT);

    const events = saga.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(RequestPaymentEvent);
    expect(events[0].payload()).toEqual({
      orderId: orderId.getValue(),
      amount: 100,
      currency: 'USD',
    });
  });
});
