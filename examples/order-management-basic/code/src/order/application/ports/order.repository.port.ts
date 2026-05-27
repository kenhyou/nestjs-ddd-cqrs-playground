import { Order } from '@order/domain/models/order.model';
import { OrderId } from '@order/domain/vo/order-id.vo';

export abstract class OrderRepositoryPort {
  abstract save(order: Order): Promise<void>;
  abstract findById(orderId: OrderId): Promise<Order | null>;
}
