import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { CreateOrderCommandHandler } from '@order/application/commands/handlers/create-order.command.handler';
import { Order } from '@order/domain/models/order.model';

describe('CreateOrderCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let handler: CreateOrderCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new CreateOrderCommandHandler(repository as any);
  });

  const items = [
    { name: 'A', quantity: 2, unitPrice: 100, currency: 'KRW' },
  ];

  it('builds an Order, saves it, and returns the new id', async () => {
    const id = await handler.execute(new CreateOrderCommand('c1', items));

    expect(repository.save).toHaveBeenCalledTimes(1);
    const saved = repository.save.mock.calls[0][0] as Order;
    expect(saved).toBeInstanceOf(Order);
    expect(saved.getCustomerId()).toBe('c1');
    expect(saved.getOrderId().getValue()).toBe(id);
  });

  it('rejects an order with no items (domain invariant bubbles)', async () => {
    await expect(
      handler.execute(new CreateOrderCommand('c1', [])),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
