import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { GetPaymentQuery } from '@payment/application/queries/get-payment.query';

@QueryHandler(GetPaymentQuery)
export class GetPaymentQueryHandler implements IQueryHandler<
  GetPaymentQuery,
  PaymentReadModel | null
> {
  constructor(private readonly paymentQueryPort: PaymentQueryPort) {}

  execute(query: GetPaymentQuery): Promise<PaymentReadModel | null> {
    return this.paymentQueryPort.findById(query.paymentId);
  }
}
