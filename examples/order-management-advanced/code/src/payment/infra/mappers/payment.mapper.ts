import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { Payment } from '@payment/domain/models/payment.model';
import { Money } from '@payment/domain/vo/money.vo';
import { PaymentId } from '@payment/domain/vo/payment-id.vo';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';

export class PaymentMapper {
  static toEntity(payment: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = payment.getPaymentId().getValue();
    entity.orderId = payment.getOrderId();
    entity.amount = payment.getAmount().getAmount();
    entity.currency = payment.getAmount().getCurrency();
    entity.method = payment.getMethod();
    entity.status = payment.getPaymentStatus();
    entity.gatewayRef = payment.getGatewayRef();
    return entity;
  }

  static toDomain(entity: PaymentEntity): Payment {
    return Payment.reconstitute(
      PaymentId.create(entity.id),
      entity.orderId,
      Money.create(entity.amount, entity.currency),
      entity.method as PaymentMethod,
      entity.status as PaymentStatus,
      entity.gatewayRef,
    );
  }
}
