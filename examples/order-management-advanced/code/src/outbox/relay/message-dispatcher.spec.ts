import { randomUUID } from 'crypto';
import { DiscoveryService } from '@nestjs/core';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { OutboxEventEntity } from '@outbox/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '@outbox/entities/processed-message.entity';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import { MessageDispatcher } from '@outbox/relay/message-dispatcher';
import { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

class FakeHandler extends MessageHandler {
  readonly messageType = 'TestEvent';
  received: InboundMessage[] = [];

  async handle(message: InboundMessage): Promise<void> {
    this.received.push(message);
  }
}

// Stand in for Nest's DiscoveryService: expose the handler as a discovered provider.
function discoveryReturning(...instances: object[]): DiscoveryService {
  return {
    getProviders: () => instances.map((instance) => ({ instance })),
  } as unknown as DiscoveryService;
}

const message = (type: string): InboundMessage => ({
  messageId: randomUUID(),
  messageType: type,
  payload: {},
});

describe('MessageDispatcher (integration, SQLite)', () => {
  let dataSource: DataSource;
  let repository: OutboxRepository;
  let handler: FakeHandler;
  let dispatcher: MessageDispatcher;

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
    await dataSource.synchronize(true);
    repository = new OutboxRepository(
      dataSource.getRepository(OutboxEventEntity),
      dataSource.getRepository(ProcessedMessageEntity),
    );
    handler = new FakeHandler();
    dispatcher = new MessageDispatcher(discoveryReturning(handler), repository);
    dispatcher.onModuleInit();
  });

  it('routes a message to the handler whose messageType matches', async () => {
    await dispatcher.dispatch(message('TestEvent'));

    expect(handler.received).toHaveLength(1);
  });

  it('does not invoke handlers for an unmatched messageType', async () => {
    await dispatcher.dispatch(message('OtherEvent'));

    expect(handler.received).toHaveLength(0);
  });

  it('processes distinct messages each once', async () => {
    await dispatcher.dispatch(message('TestEvent'));
    await dispatcher.dispatch(message('TestEvent'));

    expect(handler.received).toHaveLength(2);
  });

  // The headline Advanced criterion: at-least-once re-delivery of the SAME
  // outbox row (same messageId) must be deduped to a single side effect.
  it('deduplicates re-delivery of the same message (runs the handler once)', async () => {
    const duplicate = message('TestEvent');

    await dispatcher.dispatch(duplicate);
    await dispatcher.dispatch(duplicate);

    expect(handler.received).toHaveLength(1);
  });
});
