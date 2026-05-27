import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddOrderItemCommand } from '@order/application/commands/add-order-item.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';

@CommandHandler(AddOrderItemCommand)
export class AddOrderItemCommandHandler implements ICommandHandler<AddOrderItemCommand> {
  constructor(private readonly repository: OrderRepositoryPort) {}
  async execute(command: AddOrderItemCommand): Promise<void> {
    const order = await this.repository.findById(
      OrderId.create(command.orderId),
    );
    if (!order) {
      throw new Error('Order not found');
    }
    order.addItem(
      command.name,
      Money.create(command.unitPrice, command.currency),
      command.quantity,
    );
    await this.repository.save(order);
  }
}
