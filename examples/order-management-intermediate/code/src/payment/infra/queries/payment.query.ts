import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentQuery implements PaymentQueryPort {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repository: Repository<PaymentEntity>,
  ) {}

  async findById(paymentId: string): Promise<PaymentReadModel | null> {
    const entity = await this.repository.findOne({
      where: { paymentId: paymentId },
    });
    return entity ? this.toReadModel(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentReadModel | null> {
    const entity = await this.repository.findOne({
      where: { orderId: orderId },
    });
    return entity ? this.toReadModel(entity) : null;
  }

  private toReadModel(entity: PaymentEntity): PaymentReadModel {
    return new PaymentReadModel(
      entity.paymentId,
      entity.orderId,
      entity.amount,
      entity.currency,
      entity.method,
      entity.status,
    );
  }
}
