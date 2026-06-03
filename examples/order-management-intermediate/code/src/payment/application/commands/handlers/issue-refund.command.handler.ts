import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IssueRefundCommand } from '@payment/application/commands/issue-refund.command';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment-not-found.exception';

@CommandHandler(IssueRefundCommand)
export class IssueRefundCommandHandler implements ICommandHandler<IssueRefundCommand> {
  constructor(private readonly repository: PaymentRepositoryPort) {}

  async execute(command: IssueRefundCommand): Promise<void> {
    const payment = await this.repository.findById(
      PaymentId.create(command.paymentId),
    );

    if (!payment) throw new PaymentNotFoundException(command.paymentId);

    payment.refund();

    this.repository.save(payment);
  }
}
