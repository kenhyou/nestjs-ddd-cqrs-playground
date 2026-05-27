import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';

@CommandHandler(CreateOrderCommand)
export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(private readonly repository: OrderRepositoryPort) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const customerId = command.customerId;
    const items = command.items.map((item) =>
      OrderItem.create(
        item.name,
        Money.create(item.unitPrice, item.currency),
        item.quantity,
      ),
    );
    const order = Order.create(customerId, items);
    await this.repository.save(order);

    return order.getOrderId().getValue();
  }
}
