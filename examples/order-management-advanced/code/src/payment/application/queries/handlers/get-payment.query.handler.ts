import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { GetPaymentQuery } from '@payment/application/queries/get-payment.query';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exceptions';

@QueryHandler(GetPaymentQuery)
export class GetPaymentQueryHandler
  implements IQueryHandler<GetPaymentQuery, PaymentReadModel>
{
  constructor(private readonly paymentQuery: PaymentQueryPort) {}

  async execute(query: GetPaymentQuery): Promise<PaymentReadModel> {
    const payment = await this.paymentQuery.findById(query.paymentId);
    if (!payment) {
      throw new PaymentNotFoundException(query.paymentId);
    }
    return payment;
  }
}
