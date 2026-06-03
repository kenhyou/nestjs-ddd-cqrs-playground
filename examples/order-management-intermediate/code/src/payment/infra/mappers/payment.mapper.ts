import { Injectable } from '@nestjs/common';
import { Money } from '@payment/domain/vo/money.vo';
import { Payment } from '@payment/domain/models/payment.model';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';

@Injectable()
export class PaymentMapper {
  toOrm(payment: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.paymentId = payment.getPaymentId().getValue();
    entity.orderId = payment.getOrderId();
    entity.amount = payment.getAmount().getAmount();
    entity.currency = payment.getAmount().getCurrency();
    entity.method = payment.getMethod();
    entity.status = payment.getPaymentStatus();
    return entity;
  }

  toDomain(entity: PaymentEntity): Payment {
    return Payment.reconstitute(
      PaymentId.create(entity.paymentId),
      entity.orderId,
      Money.create(entity.amount, entity.currency),
      entity.method,
      entity.status,
    );
  }
}
