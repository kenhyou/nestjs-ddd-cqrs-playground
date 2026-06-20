import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { OutboxEventEntity } from '@outbox/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '@outbox/entities/processed-message.entity';
import { DomainEvent } from '@shared/domain/domain-event';

// SQLite raises "UNIQUE constraint failed: ..." on a duplicate composite PK.
// (Postgres would be error code 23505 — match the driver in use.)
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    /UNIQUE constraint failed/i.test(error.message)
  );
}

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepo: Repository<OutboxEventEntity>,
    @InjectRepository(ProcessedMessageEntity)
    private readonly processedRepo: Repository<ProcessedMessageEntity>,
  ) {}

  // ── Write side (D2b) ─────────────────────────────────────────────
  // Called by a BC repository INSIDE its @Transactional save. No @Transactional
  // here: it joins the caller's ambient TX (typeorm-transactional/CLS) so the
  // aggregate row and its outbox rows commit atomically (no dual-write).
  async append(
    aggregateType: string,
    aggregateId: string,
    events: DomainEvent[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const rows = events.map((event) =>
      this.outboxRepo.create({
        id: randomUUID(),
        aggregateType,
        aggregateId,
        messageType: event.eventType,
        payload: event.payload(),
        occurredAt: event.occurredAt,
        publishedAt: null,
      }),
    );

    await this.outboxRepo.save(rows);
  }

  // ── Relay side (D2) ──────────────────────────────────────────────
  // Oldest-first batch of not-yet-relayed rows.
  async findUnpublished(limit: number): Promise<OutboxEventEntity[]> {
    return this.outboxRepo.find({
      where: { publishedAt: IsNull() },
      order: { occurredAt: 'ASC' },
      take: limit,
    });
  }

  // Stamp one row published, in its OWN short TX — separate from the publish
  // step. A crash between publish and stamp re-delivers next tick (at-least-once).
  @Transactional()
  async markPublished(id: string): Promise<void> {
    await this.outboxRepo.update(id, { publishedAt: new Date() });
  }

  // ── Dedup helper (D3, Layer 2) ───────────────────────────────────
  // Claim (consumerName, messageId). Returns true if newly inserted, false if it
  // already existed. No @Transactional: the CALLER wraps insert + effect in one
  // TX so "processed" and the side effect commit together.
  async tryMarkProcessed(
    consumerName: string,
    messageId: string,
  ): Promise<boolean> {
    try {
      await this.processedRepo.insert({
        consumerName,
        messageId,
        processedAt: new Date(),
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }
}
