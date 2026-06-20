import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderNotFoundException } from '@order/domain/exceptions/order.exceptions';
import { OrderId } from '@order/domain/vo/order-id.vo';

@CommandHandler(ConfirmOrderCommand)
export class ConfirmOrderCommandHandler implements ICommandHandler<ConfirmOrderCommand> {
  constructor(private readonly orderRepository: OrderRepositoryPort) {}

  async execute(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.orderRepository.findById(
      OrderId.create(command.orderId),
    );
    if (!order) {
      throw new OrderNotFoundException(command.orderId);
    }

    order.confirm();

    await this.orderRepository.save(order);
  }
}
