import { SettlePaymentCommandHandler } from '@payment/application/commands/handlers/settle-payment.command.handler';
import { SettlePaymentCommand } from '@payment/application/commands/settle-payment.command';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';

describe('SettlePaymentCommandHandler', () => {
  let repositoryPort: { save: jest.Mock; findById: jest.Mock };
  let handler: SettlePaymentCommandHandler;

  beforeEach(() => {
    repositoryPort = { save: jest.fn(), findById: jest.fn() };
    handler = new SettlePaymentCommandHandler(repositoryPort as any);
  });

  it('can settle a payment when SUCCEEDED', async () => {
    const payment = Payment.create(
      'order-1',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );

    repositoryPort.findById.mockResolvedValue(payment);

    await handler.execute(
      new SettlePaymentCommand(PaymentId.generate().getValue(), 'SUCCEEDED'),
    );

    expect(repositoryPort.save.mock.calls[0][0].getPaymentStatus()).toBe(
      PaymentStatus.SUCCEEDED,
    );
  });

  it('cannot settle a payment when FAILED', async () => {
    const payment = Payment.create(
      'order-1',
      Money.create(1000, 'KRW'),
      PaymentMethod.BANK_TRANSFER,
    );

    repositoryPort.findById.mockResolvedValue(payment);

    await handler.execute(
      new SettlePaymentCommand(PaymentId.generate().getValue(), 'FAILED'),
    );

    expect(repositoryPort.save.mock.calls[0][0].getPaymentStatus()).toBe(
      PaymentStatus.FAILED,
    );
  });

  it('cannot find the payment', async () => {
    repositoryPort.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new SettlePaymentCommand('not-found', 'SUCCEEDED')),
    ).rejects.toThrow();
  });
});
