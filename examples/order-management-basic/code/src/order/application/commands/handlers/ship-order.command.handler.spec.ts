import { ShipOrderCommand } from '@order/application/commands/ship-order.command';
import { ShipOrderCommandHandler } from '@order/application/commands/handlers/ship-order.command.handler';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';

const VALID_UUID = '33333333-3333-4333-8333-333333333333';

const buildPendingOrder = (): Order =>
  Order.create('c1', [OrderItem.create('A', Money.create(100, 'KRW'), 1)]);

describe('ShipOrderCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let handler: ShipOrderCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new ShipOrderCommandHandler(repository as any);
  });

  it('ships a CONFIRMED order and saves it', async () => {
    const order = buildPendingOrder();
    order.confirm(); // now CONFIRMED
    repository.findById.mockResolvedValue(order);

    await handler.execute(new ShipOrderCommand(VALID_UUID));

    expect(order.getOrderStatus()).toBe(OrderStatus.SHIPPED);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('bubbles the invariant when shipping a non-CONFIRMED order', async () => {
    const order = buildPendingOrder(); // still PENDING
    repository.findById.mockResolvedValue(order);

    await expect(
      handler.execute(new ShipOrderCommand(VALID_UUID)),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws when the order is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ShipOrderCommand(VALID_UUID)),
    ).rejects.toThrow();
  });
});
