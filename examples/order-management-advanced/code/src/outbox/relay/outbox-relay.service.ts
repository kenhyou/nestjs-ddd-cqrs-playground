import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { MessageDispatcher } from '@outbox/relay/message-dispatcher';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import { InboundMessage } from '@shared/messaging/inbound-message';

// Polling relay (D2): every tick, take the oldest unpublished rows, dispatch each
// to its consumers, then stamp published_at in a SEPARATE transaction. A crash
// between dispatch and stamp re-delivers next tick → at-least-once (made safe by
// the consumer dedup in MessageDispatcher).
@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isRunning = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly dispatcher: MessageDispatcher,
  ) {}

  @Interval(1000)
  async relay(): Promise<void> {
    // A tick that runs longer than the interval must not overlap itself.
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      const rows = await this.outboxRepository.findUnpublished(100);
      for (const row of rows) {
        const message: InboundMessage = {
          messageId: row.id,
          messageType: row.messageType,
          payload: row.payload,
        };
        try {
          await this.dispatcher.dispatch(message);
          await this.outboxRepository.markPublished(row.id);
        } catch (error) {
          // Leave publishedAt = null so the row is retried next tick. No
          // dead-letter at this tier (DESIGN open question) → a poison row
          // retries indefinitely, which is acceptable for the learning scope.
          this.logger.error(
            `Relay failed for outbox row ${row.id} (${row.messageType})`,
            error as Error,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
