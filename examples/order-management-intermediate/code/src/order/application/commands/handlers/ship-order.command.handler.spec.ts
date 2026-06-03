import { ShipOrderCommandHandler } from '@order/application/commands/handlers/ship-order.command.handler';
import { ShipOrderCommand } from '@order/application/commands/ship-order.command';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderFactory } from '@order/domain/factories/order.factory';
import { PaymentCoordinator } from '@order/domain/services/payment-coordinator';

describe('ShipOrderCommandHandler', () => {
  let repository: { save: jest.Mock; findById: jest.Mock };
  let paymentStatuQueryPort: { isPaid: jest.Mock };
  let handler: ShipOrderCommandHandler;

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn() };
    paymentStatuQueryPort = { isPaid: jest.fn() };
    handler = new ShipOrderCommandHandler(
      repository,
      paymentStatuQueryPort,
      new PaymentCoordinator(),
    );
  });

  it('can ship order when paid', async () => {
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
    paymentStatuQueryPort.isPaid.mockResolvedValue(true);

    await handler.execute(new ShipOrderCommand(order.getOrderId().getValue()));

    expect(order.getOrderStatus()).toBe(OrderStatus.SHIPPED);
    expect(repository.save).toHaveBeenCalledWith(order);
  });

  it('cannot ship order when not paid', async () => {
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
    paymentStatuQueryPort.isPaid.mockResolvedValue(false);

    await expect(
      handler.execute(new ShipOrderCommand(order.getOrderId().getValue())),
    ).rejects.toThrow();

    expect(order.getOrderStatus()).toBe(OrderStatus.CONFIRMED);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
