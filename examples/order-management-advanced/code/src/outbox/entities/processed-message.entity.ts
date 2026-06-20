import { Column, Entity, PrimaryColumn } from 'typeorm';

// Composite PK (consumer_name, message_id): a second insert of the same pair
// raises a unique-violation, which the dedup helper treats as "already processed".
@Entity('processed_messages')
export class ProcessedMessageEntity {
  @PrimaryColumn()
  consumerName: string; // e.g. 'FulfillmentSaga', 'PaymentModule', 'ShipmentModule'

  @PrimaryColumn('uuid')
  messageId: string; // = outbox_events.id (stable across relay re-delivery)

  @Column({ type: 'datetime' })
  processedAt: Date;
}
