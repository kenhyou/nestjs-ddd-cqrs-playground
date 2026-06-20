import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { GetPaymentQuery } from '@payment/application/queries/get-payment.query';

@Injectable()
export class PaymentService {
  constructor(private readonly queryBus: QueryBus) {}

  getPayment(paymentId: string): Promise<PaymentReadModel> {
    return this.queryBus.execute(new GetPaymentQuery(paymentId));
  }
}
