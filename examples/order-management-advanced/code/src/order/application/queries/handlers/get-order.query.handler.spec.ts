import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { GetOrderQuery } from '@order/application/queries/get-order.query';
import { GetOrderQueryHandler } from '@order/application/queries/handlers/get-order.query.handler';

describe('GetOrderQueryHandler', () => {
  let handler: GetOrderQueryHandler;
  let orderQuery: { findById: jest.Mock };

  beforeEach(() => {
    orderQuery = { findById: jest.fn() };
    handler = new GetOrderQueryHandler(orderQuery);
  });

  it('returns the read model directly from the query port', async () => {
    const readModel: OrderReadModel = {
      id: 'order-1',
      customerId: 'cust-1',
      status: 'PENDING',
      paymentStatus: 'NONE',
      shipmentStatus: 'NONE',
      totalPrice: 200,
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 100,
          lineTotal: 200,
        },
      ],
    };
    orderQuery.findById.mockResolvedValue(readModel);

    const result = await handler.execute(new GetOrderQuery('order-1'));

    expect(orderQuery.findById).toHaveBeenCalledWith('order-1');
    expect(result).toBe(readModel);
  });

  it('throws an error if the order is not found', async () => {
    orderQuery.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetOrderQuery('order-1'))).rejects.toThrow(
      'Order not found: order-1',
    );
  });
});
