export type InboundMessage = {
  messageId: string;
  messageType: string;
  payload: Record<string, unknown>;
};
