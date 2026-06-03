import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';

@CommandHandler(CreateOrderCommand)
export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly factory: OrderFactory,
    private readonly repository: OrderRepositoryPort,
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const order = this.factory.create(command.customerId, command.items);

    await this.repository.save(order);

    return order.getOrderId().getValue();
  }
}
