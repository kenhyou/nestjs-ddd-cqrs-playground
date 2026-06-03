import { Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { Order } from '@order/domain/models/order.model';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderMapper } from '@order/infra/mappers/order.mapper';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    private readonly mapper: OrderMapper,
  ) {}

  async save(order: Order): Promise<void> {
    const entity = this.mapper.toOrm(order);
    await this.repository.save(entity);
  }

  async findById(id: OrderId): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { orderId: id.getValue() },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }
}
