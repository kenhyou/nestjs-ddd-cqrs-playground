import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { OrderNotFoundException } from '@order/domain/exceptions/order.exceptions';
import { OrderId } from '@order/domain/vo/order-id.vo';

@CommandHandler(CancelOrderCommand)
export class CancelOrderCommandHandler
  implements ICommandHandler<CancelOrderCommand>
{
  constructor(
    private readonly orderRepository: OrderRepositoryPort,
    private readonly sagaRepository: SagaRepositoryPort,
  ) {}

  async execute(command: CancelOrderCommand): Promise<void> {
    const id = OrderId.create(command.orderId);

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundException(command.orderId);
    }

    // Order.cancel() is the gate: it rejects orders that have already shipped.
    order.cancel();

    // Route compensation through the saga. A saga exists only once the order was
    // confirmed; a still-PENDING order has none, so there is nothing to compensate.
    const saga = await this.sagaRepository.findByOrderId(id);
    if (saga) {
      saga.onCancelRequested();
      await this.sagaRepository.save(saga);
    }

    await this.orderRepository.save(order);
  }
}
