import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { SagaRepositoryPort } from '@order/application/ports/saga.repository.port';
import { FulfillmentSaga } from '@order/domain/models/fulfillment-saga.model';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { FulfillmentSagaEntity } from '@order/infra/entities/fulfillment-saga.entity';
import { FulfillmentSagaMapper } from '@order/infra/mappers/fulfillment-saga.mapper';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';

@Injectable()
export class SagaRepository implements SagaRepositoryPort {
  constructor(
    @InjectRepository(FulfillmentSagaEntity)
    private readonly sagas: Repository<FulfillmentSagaEntity>,
    private readonly outbox: OutboxRepository,
  ) {}

  @Transactional()
  async save(saga: FulfillmentSaga): Promise<void> {
    const events = saga.pullEvents();
    await this.sagas.save(FulfillmentSagaMapper.toEntity(saga));
    // Saga lives in the Order BC → outbox rows are tagged aggregateType 'order'.
    await this.outbox.append('order', saga.getOrderId().getValue(), events);
  }

  async findByOrderId(orderId: OrderId): Promise<FulfillmentSaga | null> {
    const entity = await this.sagas.findOne({
      where: { orderId: orderId.getValue() },
    });
    return entity ? FulfillmentSagaMapper.toDomain(entity) : null;
  }
}
