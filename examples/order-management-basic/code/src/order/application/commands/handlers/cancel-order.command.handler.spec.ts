import { CancelOrderCommand } from '@order/application/commands/cancel-order.command';
import { CancelOrderCommandHandler } from '@order/application/commands/handlers/cancel-order.command.handler';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';

const VALID_UUID = '22222222-2222-4222-8222-222222222222';

const buildPendingOrder = (): Order =>
  Order.create('c1', [OrderItem.create('A', Money.create(100, 'KRW'), 1)]);

describe('CancelOrderCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let handler: CancelOrderCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new CancelOrderCommandHandler(repository as any);
  });

  it('cancels a PENDING order and saves it', async () => {
    const order = buildPendingOrder();
    repository.findById.mockResolvedValue(order);

    await handler.execute(new CancelOrderCommand(VALID_UUID));

    expect(order.getOrderStatus()).toBe(OrderStatus.CANCELLED);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('throws when the order is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new CancelOrderCommand(VALID_UUID)),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('bubbles the invariant when cancelling a SHIPPED order', async () => {
    const order = buildPendingOrder();
    order.confirm();
    order.ship(); // now SHIPPED
    repository.findById.mockResolvedValue(order);

    await expect(
      handler.execute(new CancelOrderCommand(VALID_UUID)),
    ).rejects.toThrow();
  });
});
