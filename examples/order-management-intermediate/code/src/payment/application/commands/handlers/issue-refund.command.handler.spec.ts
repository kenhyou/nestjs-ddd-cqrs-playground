import { Money } from '@payment/domain/vo/money.vo';
import { IssueRefundCommandHandler } from '@payment/application/commands/handlers/issue-refund.command.handler';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { IssueRefundCommand } from '@payment/application/commands/issue-refund.command';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';

describe('IssueRefundCommandHandler', () => {
  let repositoryPort: { save: jest.Mock; findById: jest.Mock };
  let handler: IssueRefundCommandHandler;

  beforeEach(() => {
    repositoryPort = { save: jest.fn(), findById: jest.fn() };
    handler = new IssueRefundCommandHandler(repositoryPort as any);
  });

  it('issue a refund', async () => {
    const payment = Payment.create(
      'order-1',
      Money.create(1000, 'KRW'),
      PaymentMethod.CARD,
    );

    repositoryPort.findById.mockResolvedValue(payment);

    payment.succeed();

    await handler.execute(
      new IssueRefundCommand(payment.getPaymentId().getValue()),
    );

    expect(repositoryPort.save.mock.calls[0][0].getPaymentStatus()).toBe(
      PaymentStatus.REFUNDED,
    );
  });

  it('fails to issue refund if there is no payment', async () => {
    repositoryPort.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new IssueRefundCommand('not-found')),
    ).rejects.toThrow();
  });
});
