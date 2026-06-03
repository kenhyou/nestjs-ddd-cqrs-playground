export type SettlementResult = 'SUCCEEDED' | 'FAILED';

export class SettlePaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly result: SettlementResult,
  ) {}
}
