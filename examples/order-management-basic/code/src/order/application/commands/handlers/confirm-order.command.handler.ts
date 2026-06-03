import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderId } from '@order/domain/vo/order-id.vo';

@CommandHandler(ConfirmOrderCommand)
export class ConfirmOrderCommandHandler implements ICommandHandler<ConfirmOrderCommand> {
  constructor(private readonly repository: OrderRepositoryPort) {}
  async execute(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.repository.findById(
      OrderId.create(command.orderId),
    );
    if (!order) {
      throw new Error('Order not found');
    }
    order.confirm();
    await this.repository.save(order);
  }
}
