import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { CancelOrderCommandHandler } from '@order/application/commands/handlers/cancel-order.command.handler';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderFactory } from '@order/domain/factories/order.factory';

describe('CancelOrderCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let handler: CancelOrderCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new CancelOrderCommandHandler(repository);
  });

  it('cancels order if the order is in PENDING state', async () => {
    const order = new OrderFactory().create('user-1', [
      {
        productId: 'p1',
        productName: 'P',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);

    repository.findById.mockResolvedValue(order);

    await handler.execute(
      new CancelOrderCommand(order.getOrderId().getValue()),
    );

    expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('cancels order if the order is in CONFIRMED state', async () => {
    const order = new OrderFactory().create('user-1', [
      {
        productId: 'p1',
        productName: 'P',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);

    order.confirm();

    repository.findById.mockResolvedValue(order);

    await handler.execute(
      new CancelOrderCommand(order.getOrderId().getValue()),
    );

    expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('fails to cancel if the order is in SHIPPED state', async () => {
    const order = new OrderFactory().create('user-1', [
      {
        productId: 'p1',
        productName: 'P',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);

    order.confirm();
    order.ship(true);

    repository.findById.mockResolvedValue(order);

    await expect(
      handler.execute(new CancelOrderCommand(order.getOrderId().getValue())),
    ).rejects.toThrow();

    expect(order.getOrderStatus()).toBe(OrderStatus.SHIPPED);
    expect(repository.save).not.toHaveBeenCalledWith(order);
  });

  it('throws error if the order is not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new CancelOrderCommand('not-found')),
    ).rejects.toThrow();
  });
});
