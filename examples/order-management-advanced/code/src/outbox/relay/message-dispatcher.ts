import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { Transactional } from 'typeorm-transactional';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';
import type { InboundMessage } from '@shared/messaging/inbound-message';
import { MessageHandler } from '@shared/messaging/message-handler';

// Routes an inbound message to every MessageHandler whose messageType matches,
// running each in its own dedup transaction (D3 Layer 2). Handlers are discovered
// across all modules at startup via DiscoveryService — no manual registration.
// Requires DiscoveryModule to be imported by the OutboxModule (Phase 5 wiring).
@Injectable()
export class MessageDispatcher implements OnModuleInit {
  private readonly handlers = new Map<string, MessageHandler[]>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as unknown;
      if (instance instanceof MessageHandler) {
        const list = this.handlers.get(instance.messageType) ?? [];
        list.push(instance);
        this.handlers.set(instance.messageType, list);
      }
    }
  }

  async dispatch(message: InboundMessage): Promise<void> {
    const handlers = this.handlers.get(message.messageType) ?? [];
    for (const handler of handlers) {
      await this.runWithDedup(handler, message);
    }
  }

  // Dedup + effect in ONE transaction (D3): claim (consumerName, messageId)
  // first; if it was already claimed, skip the handler. consumerName = handler
  // class name, so each handler dedups independently. Because the claim and the
  // handler's writes (incl. its own appended outbox rows) commit together, a
  // crash before commit re-runs cleanly; a crash after commit is deduped on the
  // relay's next re-delivery.
  @Transactional()
  private async runWithDedup(
    handler: MessageHandler,
    message: InboundMessage,
  ): Promise<void> {
    const claimed = await this.outboxRepository.tryMarkProcessed(
      handler.constructor.name,
      message.messageId,
    );
    if (!claimed) {
      return;
    }
    await handler.handle(message);
  }
}
