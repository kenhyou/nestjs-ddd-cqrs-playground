import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderNotFoundException } from '@order/domain/exceptions/order-not-found.exception';

@CommandHandler(CancelOrderCommand)
export class CancelOrderCommandHandler implements ICommandHandler<CancelOrderCommand> {
  constructor(private readonly repository: OrderRepositoryPort) {}

  async execute(command: CancelOrderCommand): Promise<void> {
    const order = await this.repository.findById(
      OrderId.create(command.orderId),
    );

    if (!order) throw new OrderNotFoundException(command.orderId);

    order.cancel();

    await this.repository.save(order);
  }
}
