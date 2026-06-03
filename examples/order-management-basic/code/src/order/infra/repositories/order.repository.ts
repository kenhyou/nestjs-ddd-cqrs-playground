import { Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { Order } from '@order/domain/models/order.model';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { Repository } from 'typeorm';
import { OrderMapper } from '@order/infra/mappers/order.mapper';

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
    private readonly mapper: OrderMapper,
  ) {}
  async save(order: Order): Promise<void> {
    const entity = this.mapper.toOrm(order);
    await this.repo.save(entity);
  }
  async findById(orderId: OrderId): Promise<Order | null> {
    const entity = await this.repo.findOne({
      where: {
        orderId: orderId.getValue(),
      },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }
}
