import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { GetPaymentQuery } from '@payment/application/queries/get-payment.query';
import { GetPaymentQueryHandler } from '@payment/application/queries/handlers/get-payment.query.handler';

describe('GetPaymentQueryHandler', () => {
  const queryPort = { findById: jest.fn(), findByOrderId: jest.fn() };
  const handler = new GetPaymentQueryHandler(queryPort as any);

  it('returns the read model from the query port (no domain/reconstitute)', async () => {
    const rm = new PaymentReadModel('p1', 'o1', 2000, 'KRW', 'CARD', 'SUCCEEDED');
    queryPort.findById.mockResolvedValue(rm);

    const result = await handler.execute(new GetPaymentQuery('p1'));

    expect(result).toBe(rm);
    expect(queryPort.findById).toHaveBeenCalledWith('p1');
  });

  it('passes through null when the payment is not found', async () => {
    queryPort.findById.mockResolvedValue(null);

    const result = await handler.execute(new GetPaymentQuery('missing'));

    expect(result).toBeNull();
  });
});
