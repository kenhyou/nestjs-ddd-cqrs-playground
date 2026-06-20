import { InboundMessage } from '@shared/messaging/inbound-message';

export abstract class MessageHandler {
  abstract readonly messageType: string;
  abstract handle(message: InboundMessage): Promise<void>;
}
