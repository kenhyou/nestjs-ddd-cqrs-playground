import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PaymentReadModel } from '@payment/application/queries/dtos/payment.read-model';
import { PaymentService } from '@payment/application/services/payment.service';

// Inspection only — Payment aggregates are created by event handlers, never HTTP.
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentReadModel> {
    return this.paymentService.getPayment(id);
  }
}
