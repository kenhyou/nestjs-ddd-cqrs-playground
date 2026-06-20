import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { Order } from '@order/domain/models/order.model';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OutboxRepository } from '@outbox/repositories/outbox.repository';

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    private readonly outbox: OutboxRepository,
  ) {}

  @Transactional()
  async save(order: Order): Promise<void> {
    const events = order.pullEvents();
    await this.orders.save(OrderMapper.toEntity(order));
    await this.outbox.append('order', order.getOrderId().getValue(), events);
  }

  async findById(orderId: OrderId): Promise<Order | null> {
    const entity = await this.orders.findOne({
      where: { id: orderId.getValue() },
    });
    return entity ? OrderMapper.toDomain(entity) : null;
  }
}
