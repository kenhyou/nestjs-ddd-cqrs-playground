import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxModule } from '@outbox/outbox.module';
import { PaymentGatewayPort } from '@payment/application/ports/payment-gateway.port';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { RequestPaymentHandler } from '@payment/application/events/handlers/request-payment.handler';
import { RequestRefundHandler } from '@payment/application/events/handlers/request-refund.handler';
import { GetPaymentQueryHandler } from '@payment/application/queries/handlers/get-payment.query.handler';
import { PaymentService } from '@payment/application/services/payment.service';
import { MockPaymentGatewayAdapter } from '@payment/infra/adapters/mock-payment-gateway.adapter';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentQuery } from '@payment/infra/queries/payment.query';
import { PaymentRepository } from '@payment/infra/repositories/payment.repository';
import { PaymentController } from '@payment/presenters/http/controllers/payment.controller';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PaymentEntity]),
    OutboxModule,
  ],
  controllers: [PaymentController],
  providers: [
    RequestPaymentHandler,
    RequestRefundHandler,
    GetPaymentQueryHandler,
    PaymentService,
    { provide: PaymentRepositoryPort, useClass: PaymentRepository },
    { provide: PaymentQueryPort, useClass: PaymentQuery },
    { provide: PaymentGatewayPort, useClass: MockPaymentGatewayAdapter },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
