import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ShipOrderCommand } from '@order/application/commands/ship-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { PaymentStatusQueryPort } from '@order/application/ports/payment-status-query.port';
import { PaymentCoordinator } from '@order/domain/services/payment-coordinator';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderNotFoundException } from '@order/domain/exceptions/order-not-found.exception';
import { InvalidOrderStateException } from '@order/domain/exceptions/invalid-order-state.exception';

@CommandHandler(ShipOrderCommand)
export class ShipOrderCommandHandler implements ICommandHandler<ShipOrderCommand> {
  constructor(
    private readonly repository: OrderRepositoryPort,
    private readonly paymentStatusQueryPort: PaymentStatusQueryPort,
    private readonly paymentCoordinator: PaymentCoordinator,
  ) {}

  async execute(command: ShipOrderCommand): Promise<void> {
    const order = await this.repository.findById(
      OrderId.create(command.orderId),
    );

    if (!order) throw new OrderNotFoundException(command.orderId);

    const isPaid = await this.paymentStatusQueryPort.isPaid(command.orderId);
    if (!this.paymentCoordinator.canShip(order, isPaid)) {
      throw new InvalidOrderStateException(
        'Order cannot be shipped: it must be confirmed and paid.',
      );
    }

    order.ship(isPaid);
    await this.repository.save(order);
  }
}
