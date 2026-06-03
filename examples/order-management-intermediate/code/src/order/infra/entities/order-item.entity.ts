import { OrderEntity } from '@order/infra/entities/order.entity';
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryColumn({ name: 'order_item_id' })
  orderItemId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column('decimal', { name: 'unit_price', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ name: 'unit_currency' })
  unitCurrency: string;

  @Column('int', { name: 'quantity' })
  quantity: number;

  @ManyToOne(() => OrderEntity, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;
}
