import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { PaymentService } from '@payment/application/services/payment.service';
import { SettlePaymentRequest } from '@payment/presenters/http/dtos/settle-payment.request';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':id/settle')
  async settlePayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() dto: SettlePaymentRequest,
  ): Promise<void> {
    await this.paymentService.settlePayment(paymentId, dto.result);
  }

  @Post(':id/refund')
  async issueRefund(
    @Param('id', ParseUUIDPipe) paymentId: string,
  ): Promise<void> {
    await this.paymentService.issueRefund(paymentId);
  }

  @Get(':id')
  async getPayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
  ): Promise<PaymentReadModel | null> {
    return this.paymentService.getPayment(paymentId);
  }
}
