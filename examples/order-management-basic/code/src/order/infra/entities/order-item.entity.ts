import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OrderEntity } from '@order/infra/entities/order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryColumn({ name: 'order_item_id' })
  orderItemId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'quantity' })
  quantity: number;

  @Column('decimal', { name: 'unit_price', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ name: 'currency' })
  currency: string;

  @ManyToOne(() => OrderEntity, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;
}
