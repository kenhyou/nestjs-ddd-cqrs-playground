import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventEntity } from '@outbox/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '@outbox/entities/processed-message.entity';
import { MessageDispatcher } from '@outbox/relay/message-dispatcher';
import { OutboxRelayService } from '@outbox/relay/outbox-relay.service';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';

// Shared infrastructure (not a BC): owns the outbox tables, the relay, and the
// dispatcher. DiscoveryModule lets the dispatcher find MessageHandlers across
// all BC modules at startup. OutboxRepository is exported so each BC repository
// can append events in the same TX as its aggregate save.
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEventEntity, ProcessedMessageEntity]),
    DiscoveryModule,
  ],
  providers: [OutboxRepository, MessageDispatcher, OutboxRelayService],
  exports: [OutboxRepository],
})
export class OutboxModule {}
