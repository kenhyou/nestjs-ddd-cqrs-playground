import { ConfirmOrderCommand } from '@order/application/commands/confirm-order.command';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

describe('ConfirmOrderCommandHandler', () => {
  let handler: ConfirmOrderCommandHandler;
  let repository: { save: jest.Mock; findById: jest.Mock };

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    handler = new ConfirmOrderCommandHandler(repository);
  });

  it('successfully confirms an order', async () => {
    const order = Order.create('cust-1', [
      OrderItem.create(
        'prod-1',
        'prod-name-1',
        Money.create(100, 'USD'),
        Quantity.create(2),
      ),
    ]);

    const orderId = order.getOrderId().getValue();
    const command = new ConfirmOrderCommand(orderId);

    repository.findById.mockResolvedValue(order);

    await handler.execute(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);
  });

  it('throws an error if it fails to find an order', async () => {
    const command = new ConfirmOrderCommand('orer-1');
    repository.findById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws an error if an order is not in pending state', async () => {
    const order = Order.create('cust-1', [
      OrderItem.create(
        'prod-1',
        'prod-name-1',
        Money.create(100, 'USD'),
        Quantity.create(2),
      ),
    ]);
    order.confirm();

    const orderId = order.getOrderId().getValue();
    const command = new ConfirmOrderCommand(orderId);

    repository.findById.mockResolvedValue(order);

    await expect(handler.execute(command)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
