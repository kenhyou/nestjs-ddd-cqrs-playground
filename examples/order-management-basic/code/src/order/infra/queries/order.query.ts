import { Injectable } from '@nestjs/common';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { Repository } from 'typeorm';
import {
  OrderItemReadModel,
  OrderReadModel,
} from '@order/application/queries/dtos/order.read-model';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderQuery implements OrderQueryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
  ) {}

  async findById(orderId: string): Promise<OrderReadModel | null> {
    const order = await this.repo.findOne({ where: { orderId: orderId } });

    if (!order) {
      return null;
    }

    return this.toReadModel(order);
  }

  private toReadModel(entity: OrderEntity): OrderReadModel {
    return new OrderReadModel(
      entity.orderId,
      entity.customerId,
      entity.status,
      entity.items.map((item) => this.toItemReadModel(item)),
      entity.totalAmount,
      entity.totalCurrency,
    );
  }

  private toItemReadModel(entity: OrderItemEntity): OrderItemReadModel {
    return new OrderItemReadModel(
      entity.orderItemId,
      entity.name,
      entity.quantity,
      entity.unitPrice,
    );
  }
}
