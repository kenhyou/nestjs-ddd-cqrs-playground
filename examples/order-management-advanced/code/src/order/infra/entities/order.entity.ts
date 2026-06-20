import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  status: string;

  @Column('integer')
  totalPriceAmount: number;

  @Column()
  totalPriceCurrency: string;

  // Denormalized read-model columns — populated by the saga→Order wiring in
  // Phase 4; null until then.
  @Column({ type: 'varchar', nullable: true })
  paymentStatus: string | null;

  @Column({ type: 'varchar', nullable: true })
  shipmentStatus: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItemEntity[];
}
