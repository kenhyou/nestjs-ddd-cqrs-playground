import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';
import { PaymentController } from '@payment/presenters/http/controllers/payment.controller';
import { PaymentRepositoryPort } from '@payment/application/ports/payment.repository.port';
import { PaymentRepository } from '@payment/infra/repositories/payment.repository';
import { PaymentQueryPort } from '@payment/application/ports/payment.query.port';
import { PaymentQuery } from '@payment/infra/queries/payment.query';
import { PaymentMapper } from '@payment/infra/mappers/payment.mapper';
import { SettlePaymentCommandHandler } from '@payment/application/commands/handlers/settle-payment.command.handler';
import { IssueRefundCommandHandler } from '@payment/application/commands/handlers/issue-refund.command.handler';
import { GetPaymentQueryHandler } from '@payment/application/queries/handlers/get-payment.query.handler';
import { PaymentService } from '@payment/application/services/payment.service';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PaymentEntity])],
  controllers: [PaymentController],
  providers: [
    // mapper
    PaymentMapper,
    // facade
    PaymentService,
    // command handlers
    SettlePaymentCommandHandler,
    IssueRefundCommandHandler,
    // query handler
    GetPaymentQueryHandler,
    // port bindings
    { provide: PaymentRepositoryPort, useClass: PaymentRepository },
    { provide: PaymentQueryPort, useClass: PaymentQuery },
  ],
  exports: [
    // the ACL adapters (in PaymentPortsModule) need these two ports
    PaymentRepositoryPort,
    PaymentQueryPort,
  ],
})
export class PaymentModule {}
