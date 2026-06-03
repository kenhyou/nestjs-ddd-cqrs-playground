import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ShipOrderCommand } from '@order/application/commands/ship-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderId } from '@order/domain/vo/order-id.vo';

@CommandHandler(ShipOrderCommand)
export class ShipOrderCommandHandler implements ICommandHandler<ShipOrderCommand> {
  constructor(private readonly repository: OrderRepositoryPort) {}
  async execute(command: ShipOrderCommand): Promise<void> {
    const order = await this.repository.findById(
      OrderId.create(command.orderId),
    );
    if (!order) {
      throw new Error('Order not found');
    }
    order.ship();
    await this.repository.save(order);
  }
}
