import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SettlePaymentCommand } from '@payment/application/commands/settle-payment.command';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment-not-found.exception';

@CommandHandler(SettlePaymentCommand)
export class SettlePaymentCommandHandler implements ICommandHandler<SettlePaymentCommand> {
  constructor(private readonly repository: PaymentRepositoryPort) {}

  async execute(command: SettlePaymentCommand): Promise<void> {
    const payment = await this.repository.findById(
      PaymentId.create(command.paymentId),
    );

    if (!payment) throw new PaymentNotFoundException(command.paymentId);

    if (command.result === PaymentStatus.SUCCEEDED) payment.succeed();
    else payment.fail();

    this.repository.save(payment);
  }
}
