import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { GetPaymentQuery } from '@payment/application/queries/get-payment.query';
import { GetPaymentQueryHandler } from '@payment/application/queries/handlers/get-payment.query.handler';

describe('GetPaymentQueryHandler', () => {
  let handler: GetPaymentQueryHandler;
  let paymentQuery: { findById: jest.Mock };

  beforeEach(() => {
    paymentQuery = { findById: jest.fn() };
    handler = new GetPaymentQueryHandler(paymentQuery);
  });

  it('returns the read model directly from the query port', async () => {
    const readModel: PaymentReadModel = {
      id: 'pay-1',
      orderId: 'order-1',
      amount: 200,
      currency: 'USD',
      method: 'CARD',
      status: 'SUCCEEDED',
      gatewayRef: 'gw-ref-1',
    };
    paymentQuery.findById.mockResolvedValue(readModel);

    const result = await handler.execute(new GetPaymentQuery('pay-1'));

    expect(paymentQuery.findById).toHaveBeenCalledWith('pay-1');
    expect(result).toBe(readModel);
  });

  it('throws an error if the payment is not found', async () => {
    paymentQuery.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetPaymentQuery('pay-1')),
    ).rejects.toThrow('Payment not found: pay-1');
  });
});
