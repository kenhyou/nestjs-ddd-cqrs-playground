import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { Payment } from '@payment/domain/models/payment.model';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';

@Injectable()
export class PaymentRepository implements PaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    private readonly outbox: OutboxRepository,
  ) {}

  // Aggregate row + its outbox rows commit atomically (D2b): the @Transactional
  // here is the TX that outbox.append() joins (it has none of its own).
  @Transactional()
  async save(payment: Payment): Promise<void> {
    const events = payment.pullEvents();
    await this.payments.save(PaymentMapper.toEntity(payment));
    await this.outbox.append(
      'payment',
      payment.getPaymentId().getValue(),
      events,
    );
  }

  async findById(paymentId: PaymentId): Promise<Payment | null> {
    const entity = await this.payments.findOne({
      where: { id: paymentId.getValue() },
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }
}
