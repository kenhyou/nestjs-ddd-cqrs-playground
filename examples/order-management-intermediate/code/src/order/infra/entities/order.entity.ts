import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'status', type: 'simple-enum', enum: OrderStatus })
  status: OrderStatus;

  @Column('decimal', { name: 'total_amount', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ name: 'total_currency' })
  totalCurrency: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItemEntity[];
}
