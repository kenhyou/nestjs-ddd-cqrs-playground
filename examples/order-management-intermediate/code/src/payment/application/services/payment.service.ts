import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IssueRefundCommand } from '@payment/application/commands/issue-refund.command';
import {
  SettlementResult,
  SettlePaymentCommand,
} from '@payment/application/commands/settle-payment.command';
import { GetPaymentQuery } from '@payment/application/queries/get-payment.query';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';

@Injectable()
export class PaymentService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  settlePayment(paymentId: string, result: SettlementResult): Promise<void> {
    return this.commandBus.execute(new SettlePaymentCommand(paymentId, result));
  }

  issueRefund(paymentId: string): Promise<void> {
    return this.commandBus.execute(new IssueRefundCommand(paymentId));
  }

  getPayment(paymentId: string): Promise<PaymentReadModel | null> {
    return this.queryBus.execute(new GetPaymentQuery(paymentId));
  }
}
