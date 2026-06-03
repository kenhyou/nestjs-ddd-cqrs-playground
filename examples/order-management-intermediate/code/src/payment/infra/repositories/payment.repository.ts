import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { Payment } from '@payment/domain/models/payment.model';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentRepository implements PaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repository: Repository<PaymentEntity>,
    private readonly mapper: PaymentMapper,
  ) {}

  async save(payment: Payment): Promise<void> {
    const entiry = this.mapper.toOrm(payment);
    await this.repository.save(entiry);
  }

  async findById(paymentId: PaymentId): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: { paymentId: paymentId.getValue() },
    });

    return entity ? this.mapper.toDomain(entity) : null;
  }
}
