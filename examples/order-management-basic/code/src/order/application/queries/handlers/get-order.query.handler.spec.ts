import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { GetOrderQuery } from '@order/application/queries/get-order.query';
import { GetOrderQueryHandler } from '@order/application/queries/handlers/get-order.query.handler';

describe('GetOrderQueryHandler', () => {
  const queryPort = { findById: jest.fn() };
  const handler = new GetOrderQueryHandler(queryPort as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns the read model from the query port (no domain/reconstitute)', async () => {
    const rm = new OrderReadModel('o1', 'c1', 'PENDING', [], 200, 'KRW');
    queryPort.findById.mockResolvedValue(rm);

    const result = await handler.execute(new GetOrderQuery('o1'));

    expect(result).toBe(rm);
    expect(queryPort.findById).toHaveBeenCalledWith('o1');
  });

  it('passes through null when the order is not found', async () => {
    queryPort.findById.mockResolvedValue(null);

    const result = await handler.execute(new GetOrderQuery('missing'));

    expect(result).toBeNull();
  });
});
