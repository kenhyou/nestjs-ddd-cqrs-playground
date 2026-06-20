import { RequestRefundHandler } from '@payment/application/events/handlers/request-refund.handler';
import { PaymentGatewayPort } from '@payment/application/ports/payment-gateway.port';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { RefundIssuedEvent } from '@payment/domain/events/refund-issued.event';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';

describe('RequestRefundHandler', () => {
  let handler: RequestRefundHandler;
  let paymentRepository: jest.Mocked<PaymentRepositoryPort>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;

  beforeEach(() => {
    paymentRepository = { save: jest.fn(), findById: jest.fn() };
    paymentGateway = { charge: jest.fn(), refund: jest.fn() };
    handler = new RequestRefundHandler(paymentRepository, paymentGateway);
  });

  const buildSucceededPayment = () =>
    Payment.reconstitute(
      PaymentId.generate(),
      'order-1',
      Money.create(100, 'USD'),
      PaymentMethod.CARD,
      PaymentStatus.SUCCEEDED,
      'gw-1',
    );

  const message = (paymentId: string) => ({
    messageId: 'msg-1',
    messageType: 'RequestRefund',
    payload: { paymentId },
  });

  it('refunds the payment when the gateway confirms', async () => {
    const payment = buildSucceededPayment();
    paymentRepository.findById.mockResolvedValue(payment);
    paymentGateway.refund.mockResolvedValue({ refunded: true });

    await handler.handle(message(payment.getPaymentId().getValue()));

    expect(paymentGateway.refund).toHaveBeenCalledWith({ gatewayRef: 'gw-1' });
    expect(paymentRepository.save).toHaveBeenCalledTimes(1);

    const saved = paymentRepository.save.mock.calls[0][0];
    expect(saved.getPaymentStatus()).toBe(PaymentStatus.REFUNDED);
    expect(saved.pullEvents().at(-1)).toBeInstanceOf(RefundIssuedEvent);
  });

  it('throws and saves nothing if the payment is not found', async () => {
    paymentRepository.findById.mockResolvedValue(null);

    await expect(
      handler.handle(message(PaymentId.generate().getValue())),
    ).rejects.toThrow();

    expect(paymentGateway.refund).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('throws and saves nothing if the gateway declines the refund', async () => {
    const payment = buildSucceededPayment();
    paymentRepository.findById.mockResolvedValue(payment);
    paymentGateway.refund.mockResolvedValue({ refunded: false });

    await expect(
      handler.handle(message(payment.getPaymentId().getValue())),
    ).rejects.toThrow();

    expect(paymentRepository.save).not.toHaveBeenCalled();
  });
});
