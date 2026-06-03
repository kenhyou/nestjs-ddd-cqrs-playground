import { AddOrderItemCommand } from '@order/application/commands/add-order-item.command';
import { AddOrderItemCommandHandler } from '@order/application/commands/handlers/add-order-item.command.handler';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';

const VALID_UUID = '44444444-4444-4444-8444-444444444444';

const buildPendingOrder = (): Order =>
  Order.create('c1', [OrderItem.create('A', Money.create(100, 'KRW'), 1)]);

describe('AddOrderItemCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let handler: AddOrderItemCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new AddOrderItemCommandHandler(repository as any);
  });

  it('adds an item to a PENDING order and saves it', async () => {
    const order = buildPendingOrder();
    repository.findById.mockResolvedValue(order);

    await handler.execute(
      new AddOrderItemCommand(VALID_UUID, 'B', 2, 200, 'KRW'),
    );

    expect(order.getOrderItems()).toHaveLength(2);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('throws when the order is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new AddOrderItemCommand(VALID_UUID, 'B', 2, 200, 'KRW')),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('bubbles the invariant when adding to a non-PENDING order', async () => {
    const order = buildPendingOrder();
    order.confirm(); // now CONFIRMED
    repository.findById.mockResolvedValue(order);

    await expect(
      handler.execute(new AddOrderItemCommand(VALID_UUID, 'B', 2, 200, 'KRW')),
    ).rejects.toThrow();
  });
});
