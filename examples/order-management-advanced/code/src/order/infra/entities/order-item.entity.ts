import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { OrderEntity } from '@order/infra/entities/order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column('integer')
  unitPriceAmount: number;

  @Column()
  unitPriceCurrency: string;

  @Column('integer')
  quantity: number;

  // Same Aggregate (Order ↔ OrderItem) → @ManyToOne/FK is allowed here.
  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  order: OrderEntity;
}
