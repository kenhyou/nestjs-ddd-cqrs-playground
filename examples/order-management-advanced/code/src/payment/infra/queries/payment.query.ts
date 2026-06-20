import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';

@Injectable()
export class PaymentQuery implements PaymentQueryPort {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
  ) {}

  async findById(paymentId: string): Promise<PaymentReadModel | null> {
    const entity = await this.payments.findOne({ where: { id: paymentId } });
    if (!entity) {
      return null;
    }
    return {
      id: entity.id,
      orderId: entity.orderId,
      amount: entity.amount,
      currency: entity.currency,
      method: entity.method,
      status: entity.status,
      gatewayRef: entity.gatewayRef,
    };
  }
}
