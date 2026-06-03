import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

const buildPendingOrder = (): Order =>
  Order.create('c1', [OrderItem.create('A', Money.create(100, 'KRW'), 1)]);

describe('ConfirmOrderCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let handler: ConfirmOrderCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new ConfirmOrderCommandHandler(repository as any);
  });

  it('confirms a PENDING order and saves it', async () => {
    const order = buildPendingOrder();
    repository.findById.mockResolvedValue(order);

    await handler.execute(new ConfirmOrderCommand(VALID_UUID));

    expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('throws when the order is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ConfirmOrderCommand(VALID_UUID)),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('bubbles the invariant when confirming a non-PENDING order', async () => {
    const order = buildPendingOrder();
    order.confirm(); // now CONFIRMED
    repository.findById.mockResolvedValue(order);

    await expect(
      handler.execute(new ConfirmOrderCommand(VALID_UUID)),
    ).rejects.toThrow();
  });
});
