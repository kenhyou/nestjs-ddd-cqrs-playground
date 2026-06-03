import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { CreateOrderCommandHandler } from '@order/application/commands/handlers/create-order.command.handler';
import { OrderFactory } from '@order/domain/factories/order.factory';

describe('CreateOrderCommandHandler', () => {
  const repo = { save: jest.fn(), findById: jest.fn() };
  const handler = new CreateOrderCommandHandler(
    new OrderFactory(),
    repo as any,
  );

  it('build an order and saves it', async () => {
    const id = await handler.execute(
      new CreateOrderCommand('c1', [
        {
          productId: 'p1',
          productName: 'p1',
          unitPrice: 10,
          currency: 'USD',
          quantity: 2,
        },
      ]),
    );

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save.mock.calls[0][0].getTotalPrice().getAmount()).toBe(20);
    expect(typeof id).toBe('string');
  });
});
