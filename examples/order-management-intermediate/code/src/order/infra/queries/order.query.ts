import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OrderItemReadModel,
  OrderReadModel,
} from '@order/application/queries/dtos/order.read-model';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderQuery {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findById(orderId: string): Promise<OrderReadModel | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toReadModel(entity) : null;
  }

  private toReadModel(e: OrderEntity): OrderReadModel {
    return new OrderReadModel(
      e.orderId,
      e.customerId,
      e.status,
      e.items.map((i) => this.toItemReadModel(i)),
      e.totalAmount,
      e.totalCurrency,
    );
  }

  private toItemReadModel(i: OrderItemEntity): OrderItemReadModel {
    return new OrderItemReadModel(
      i.orderItemId,
      i.productId,
      i.productName,
      i.quantity,
      i.unitPrice,
    );
  }
}
