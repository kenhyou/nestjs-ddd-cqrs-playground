import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { SagaStatus } from '@order/domain/enums/saga-status.enum';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { FulfillmentSagaEntity } from '@order/infra/entities/fulfillment-saga.entity';

// Polls sagas whose current AWAITING_* step has passed its deadline and drives
// saga.onTimeout() (→ CANCELLED, or COMPENSATING + RequestRefund). The save goes
// through SagaRepository, so any compensation event lands in the outbox. (The
// implemented saga handles timeout directly — there is no OrderTimedOut event.)
@Injectable()
export class SagaTimeoutScheduler {
  private static readonly AWAITING_STATES = [
    SagaStatus.AWAITING_PAYMENT,
    SagaStatus.AWAITING_SHIPMENT,
  ];

  private readonly logger = new Logger(SagaTimeoutScheduler.name);
  private isRunning = false;

  constructor(
    @InjectRepository(FulfillmentSagaEntity)
    private readonly sagaEntities: Repository<FulfillmentSagaEntity>,
    private readonly sagaRepository: SagaRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  @Interval(1000)
  async checkTimeouts(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      const due = await this.sagaEntities.find({
        where: {
          status: In(SagaTimeoutScheduler.AWAITING_STATES),
          awaitingUntil: LessThan(new Date()),
        },
      });
      for (const entity of due) {
        try {
          await this.timeOut(entity.orderId);
        } catch (error) {
          this.logger.error(
            `Saga timeout failed for order ${entity.orderId}`,
            error as Error,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  @Transactional()
  private async timeOut(orderId: string): Promise<void> {
    const id = OrderId.create(orderId);
    const saga = await this.sagaRepository.findByOrderId(id);
    if (!saga) {
      return;
    }
    saga.onTimeout();
    await this.sagaRepository.save(saga);

    // Direct cancel (timed out while AWAITING_PAYMENT): no refund event will
    // follow, so cancel the Order here. The AWAITING_SHIPMENT path goes through
    // COMPENSATING → refund → RefundIssuedHandler, which cancels the Order there.
    if (saga.getSagaStatus() === SagaStatus.CANCELLED) {
      const order = await this.orderRepository.findById(id);
      if (order?.isCancellable()) {
        order.cancel();
        await this.orderRepository.save(order);
      }
    }
  }
}
