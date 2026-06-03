import { Module } from '@nestjs/common';
import { PaymentModule } from '@payment/payment.module';
import { PaymentCommandPort } from '@order/application/ports/payment-command.port';
import { PaymentCommandAdapter } from '@order/infra/adapters/payment-command.adapter';
import { PaymentStatusQueryPort } from '@order/application/ports/payment-status-query.port';
import { PaymentStatusQueryAdapter } from '@order/infra/adapters/payment-status-query.adapter';

@Module({
  imports: [PaymentModule], // provides PaymentRepositoryPort + PaymentQueryPort (the adapters' deps)
  providers: [
    { provide: PaymentCommandPort, useClass: PaymentCommandAdapter },
    { provide: PaymentStatusQueryPort, useClass: PaymentStatusQueryAdapter },
  ],
  exports: [PaymentCommandPort, PaymentStatusQueryPort],
})
export class PaymentPortsModule {}
