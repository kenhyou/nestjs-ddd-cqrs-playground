import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';

@CommandHandler(CreateOrderCommand)
export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepositoryPort,
    private readonly orderFactory: OrderFactory,
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const order = this.orderFactory.create(command.customerId, command.items);

    await this.orderRepository.save(order);

    return order.getOrderId().getValue();
  }
}
