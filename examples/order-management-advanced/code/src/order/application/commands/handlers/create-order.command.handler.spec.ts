import { CreateOrderCommand } from '@order/application/commands/create-order.command';
import { CreateOrderCommandHandler } from '@order/application/commands/handlers/create-order.command.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import {
  OrderFactory,
  OrderItemInput,
} from '@order/domain/factories/order.factory';
import { Order } from '@order/domain/models/order.model';

describe('CreateOrderCommandHandler', () => {
  let handler: CreateOrderCommandHandler;
  let orderRepository: { save: jest.Mock; findById: jest.Mock };
  let orderFactory: OrderFactory;

  beforeEach(() => {
    orderRepository = { save: jest.fn(), findById: jest.fn() };
    orderFactory = new OrderFactory();
    handler = new CreateOrderCommandHandler(orderRepository, orderFactory);
  });

  it('should create an order successfully', async () => {
    const command = new CreateOrderCommand('cust-1', [
      {
        productId: 'prod-1',
        productName: 'prod-name-1',
        unitPrice: 100,
        currency: 'USD',
        quantity: 1,
      },
    ]);

    const orderId = await handler.execute(command);

    const order = orderRepository.save.mock.calls[0][0];

    expect(order).toBeInstanceOf(Order);
    expect(order.getOrderId().getValue()).toBe(orderId);
    expect(order.getCustomerId()).toBe('cust-1');
    expect(order.getOrderStatus()).toBe(OrderStatus.PENDING);
    expect(order.getOrderItems().length).toBe(1);
    expect(order.getTotalPrice().getAmount()).toBe(100);
    expect(order.getTotalPrice().getCurrency()).toBe('USD');

    expect(orderRepository.save).toHaveBeenCalledTimes(1);
  });
});
