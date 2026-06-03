import { IsIn } from 'class-validator';
import type { SettlementResult } from '@payment/application/commands/settle-payment.command';

export class SettlePaymentRequest {
  @IsIn(['SUCCEEDED', 'FAILED'])
  result: SettlementResult;
}
