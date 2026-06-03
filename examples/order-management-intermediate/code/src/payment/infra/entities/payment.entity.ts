import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryColumn({ name: 'payment_id' })
  paymentId: string;

  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @Column('decimal', { name: 'amount', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'currency' })
  currency: string;

  @Column({ name: 'method', type: 'simple-enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ name: 'status', type: 'simple-enum', enum: PaymentStatus })
  status: PaymentStatus;
}
