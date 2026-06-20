import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { OutboxEventEntity } from '@outbox/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '@outbox/entities/processed-message.entity';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import { DomainEvent } from '@shared/domain/domain-event';

class FakeEvent extends DomainEvent {
  constructor(
    readonly eventType: string,
    private readonly data: Record<string, unknown>,
  ) {
    super();
  }

  payload(): Record<string, unknown> {
    return this.data;
  }
}

describe('OutboxRepository (integration, SQLite)', () => {
  let dataSource: DataSource;
  let repository: OutboxRepository;

  beforeAll(async () => {
    initializeTransactionalContext();
    dataSource = addTransactionalDataSource(
      new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: [OutboxEventEntity, ProcessedMessageEntity],
        synchronize: true,
      }),
    );
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
    deleteDataSourceByName('default');
  });

  beforeEach(async () => {
    await dataSource.synchronize(true); // drop + recreate → clean slate
    repository = new OutboxRepository(
      dataSource.getRepository(OutboxEventEntity),
      dataSource.getRepository(ProcessedMessageEntity),
    );
  });

  describe('append + findUnpublished', () => {
    it('serializes events into unpublished rows', async () => {
      await repository.append('order', 'order-1', [
        new FakeEvent('OrderConfirmed', { orderId: 'order-1', total: 200 }),
        new FakeEvent('PaymentRequested', { orderId: 'order-1' }),
      ]);

      const rows = await repository.findUnpublished(10);

      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.publishedAt === null)).toBe(true);
      expect(rows.map((r) => r.messageType)).toEqual(
        expect.arrayContaining(['OrderConfirmed', 'PaymentRequested']),
      );
      const confirmed = rows.find((r) => r.messageType === 'OrderConfirmed');
      expect(confirmed?.aggregateType).toBe('order');
      expect(confirmed?.aggregateId).toBe('order-1');
      expect(confirmed?.payload).toEqual({ orderId: 'order-1', total: 200 });
    });

    it('is a no-op when there are no events', async () => {
      await repository.append('order', 'order-1', []);

      expect(await repository.findUnpublished(10)).toHaveLength(0);
    });

    it('respects the batch limit', async () => {
      await repository.append('order', 'order-1', [
        new FakeEvent('A', {}),
        new FakeEvent('B', {}),
        new FakeEvent('C', {}),
      ]);

      expect(await repository.findUnpublished(2)).toHaveLength(2);
    });
  });

  describe('markPublished', () => {
    it('excludes a row from the unpublished set once stamped', async () => {
      await repository.append('order', 'order-1', [
        new FakeEvent('OrderConfirmed', {}),
        new FakeEvent('PaymentRequested', {}),
      ]);
      const [first, second] = await repository.findUnpublished(10);

      await repository.markPublished(first.id);

      const remaining = await repository.findUnpublished(10);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(second.id);
    });
  });

  describe('tryMarkProcessed (dedup)', () => {
    it('claims a (consumer, messageId) pair only once', async () => {
      expect(await repository.tryMarkProcessed('ConsumerA', 'msg-1')).toBe(true);
      expect(await repository.tryMarkProcessed('ConsumerA', 'msg-1')).toBe(
        false,
      );
    });

    it('scopes the claim per consumer and per message', async () => {
      await repository.tryMarkProcessed('ConsumerA', 'msg-1');

      // same message, different consumer → independent claim
      expect(await repository.tryMarkProcessed('ConsumerB', 'msg-1')).toBe(true);
      // same consumer, different message → independent claim
      expect(await repository.tryMarkProcessed('ConsumerA', 'msg-2')).toBe(true);
    });
  });
});
