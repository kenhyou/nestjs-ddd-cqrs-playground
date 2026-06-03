import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  // simple-enum (TypeORM stores it as varchar)
  @Column({ name: 'status', type: 'simple-enum', enum: OrderStatus })
  status: OrderStatus;

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItemEntity[];

  @Column('decimal', { name: 'total_amount', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ name: 'total_currency' })
  totalCurrency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
