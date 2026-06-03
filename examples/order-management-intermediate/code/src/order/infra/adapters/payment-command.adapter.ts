import { Injectable } from '@nestjs/common';
import { PaymentCommandPort } from '@order/application/ports/payment-command.port';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';

@Injectable()
export class PaymentCommandAdapter implements PaymentCommandPort {
  constructor(private readonly paymentRepository: PaymentRepositoryPort) {}

  async createPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: string,
  ): Promise<void> {
    const payment = Payment.create(
      orderId,
      Money.create(amount, currency),
      method as PaymentMethod,
    );
    await this.paymentRepository.save(payment);
  }
}
