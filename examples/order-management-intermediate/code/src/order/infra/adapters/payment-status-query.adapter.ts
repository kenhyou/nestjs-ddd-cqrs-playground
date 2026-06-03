import { Injectable } from '@nestjs/common';
import { PaymentStatusQueryPort } from '@order/application/ports/payment-status-query.port';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';

@Injectable()
export class PaymentStatusQueryAdapter implements PaymentStatusQueryPort {
  constructor(private readonly paymentQuery: PaymentQueryPort) {}

  async isPaid(orderId: string): Promise<boolean> {
    const payment = await this.paymentQuery.findByOrderId(orderId);
    return payment?.status === 'SUCCEEDED';
  }
}
