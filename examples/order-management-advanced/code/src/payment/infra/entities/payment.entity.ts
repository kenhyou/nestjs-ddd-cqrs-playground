import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Cross-aggregate reference (Order) — plain indexed column, never a FK.
  @Index()
  @Column()
  orderId: string;

  @Column('integer')
  amount: number;

  @Column()
  currency: string;

  @Column()
  method: string;

  @Column()
  status: string;

  @Column({ type: 'varchar', nullable: true })
  gatewayRef: string | null;
}
