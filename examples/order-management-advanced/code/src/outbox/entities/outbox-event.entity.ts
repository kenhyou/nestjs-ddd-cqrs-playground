import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('outbox_events')
export class OutboxEventEntity {
  // Not generated: this id is the stable dedup key (D3: processed_messages.message_id
  // = outbox_events.id), so it is assigned in code when the row is appended.
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  aggregateType: string; // 'order' | 'payment' | 'shipment'

  @Column()
  aggregateId: string; // orderId / paymentId / shipmentId

  @Column()
  messageType: string; // from DomainEvent.eventType

  @Column('simple-json')
  payload: Record<string, unknown>;

  @Column({ type: 'datetime' })
  occurredAt: Date;

  // null = not yet relayed; the relay polls on this column.
  @Index()
  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date | null;
}
