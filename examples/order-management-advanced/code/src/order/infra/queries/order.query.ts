import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { OrderEntity } from '@order/infra/entities/order.entity';

@Injectable()
export class OrderQuery implements OrderQueryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
  ) {}

  async findById(orderId: string): Promise<OrderReadModel | null> {
    const entity = await this.orders.findOne({ where: { id: orderId } });
    if (!entity) {
      return null;
    }
    return {
      id: entity.id,
      customerId: entity.customerId,
      status: entity.status,
      paymentStatus: entity.paymentStatus ?? 'NONE',
      shipmentStatus: entity.shipmentStatus ?? 'NONE',
      totalPrice: entity.totalPriceAmount,
      items: (entity.items ?? []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPriceAmount,
        lineTotal: item.unitPriceAmount * item.quantity,
      })),
    };
  }
}
