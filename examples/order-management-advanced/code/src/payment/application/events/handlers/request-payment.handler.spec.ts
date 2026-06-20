import { RequestPaymentHandler } from '@payment/application/events/handlers/request-payment.handler';
import { PaymentGatewayPort } from '@payment/application/ports/payment-gateway.port';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { PaymentFailedEvent } from '@payment/domain/events/payment-failed.event';
import { PaymentSucceededEvent } from '@payment/domain/events/payment-succeeded.event';

describe('RequestPaymentHandler', () => {
  let handler: RequestPaymentHandler;
  let paymentRepository: jest.Mocked<PaymentRepositoryPort>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;

  beforeEach(() => {
    paymentRepository = { save: jest.fn(), findById: jest.fn() };
    paymentGateway = { charge: jest.fn(), refund: jest.fn() };
    handler = new RequestPaymentHandler(paymentRepository, paymentGateway);
  });

  const message = () => ({
    messageId: 'msg-1',
    messageType: 'RequestPayment',
    payload: { orderId: 'order-1', amount: 100, currency: 'USD' },
  });

  it('succeeds the payment when the gateway settles', async () => {
    paymentGateway.charge.mockResolvedValue({
      settled: true,
      gatewayRef: 'gw-1',
    });

    await handler.handle(message());

    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
    const saved = paymentRepository.save.mock.calls[0][0];
    expect(saved.getPaymentStatus()).toBe(PaymentStatus.SUCCEEDED);
    expect(saved.getGatewayRef()).toBe('gw-1');
    expect(saved.pullEvents().at(-1)).toBeInstanceOf(PaymentSucceededEvent);
  });

  it('fails the payment when the gateway declines', async () => {
    paymentGateway.charge.mockResolvedValue({ settled: false, gatewayRef: '' });

    await handler.handle(message());

    const saved = paymentRepository.save.mock.calls[0][0];
    expect(saved.getPaymentStatus()).toBe(PaymentStatus.FAILED);
    expect(saved.pullEvents().at(-1)).toBeInstanceOf(PaymentFailedEvent);
  });
});
