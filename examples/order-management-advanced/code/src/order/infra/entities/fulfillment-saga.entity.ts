import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('fulfillment_sagas')
export class FulfillmentSagaEntity {
  // 1:1 with Order, keyed by orderId — plain PK, no FK across the aggregate.
  @PrimaryColumn('uuid')
  orderId: string;

  @Column()
  status: string;

  @Column({ type: 'varchar', nullable: true })
  paymentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  shipmentId: string | null;

  // Deadline for the current AWAITING_* step; the timeout Scheduler polls this.
  @Column({ type: 'datetime', nullable: true })
  awaitingUntil: Date | null;
}
