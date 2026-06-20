export abstract class DomainEvent {
  readonly occurredAt: Date = new Date();
  // outbox.message_type, e.g. 'OrderConfirmed'
  abstract readonly eventType: string;
  // outbox.payload (primative only)
  abstract payload(): Record<string, unknown>;
}
