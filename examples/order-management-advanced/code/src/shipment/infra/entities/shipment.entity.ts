import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('shipments')
export class ShipmentEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Cross-aggregate reference (Order) — plain indexed column, never a FK.
  @Index()
  @Column()
  orderId: string;

  @Column()
  status: string;

  @Column({ type: 'varchar', nullable: true })
  trackingCode: string | null;
}
