import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { PaymentCommandPort } from '@order/application/ports/payment-command.port';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderNotFoundException } from '@order/domain/exceptions/order-not-found.exception';
import { Transactional } from 'typeorm-transactional';

@CommandHandler(ConfirmOrderCommand)
export class ConfirmOrderCommandHandler implements ICommandHandler<ConfirmOrderCommand> {
  constructor(
    private readonly repository: OrderRepositoryPort,
    private readonly paymentCommandPort: PaymentCommandPort,
  ) {}

  @Transactional()
  async execute(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.repository.findById(
      OrderId.create(command.orderId),
    );

    if (!order) {
      throw new OrderNotFoundException(command.orderId);
    }

    order.confirm();
    await this.repository.save(order);

    const totalPrice = order.getTotalPrice();
    await this.paymentCommandPort.createPayment(
      command.orderId,
      totalPrice.getAmount(),
      totalPrice.getCurrency(),
      command.paymentMethod,
    );
  }
}
