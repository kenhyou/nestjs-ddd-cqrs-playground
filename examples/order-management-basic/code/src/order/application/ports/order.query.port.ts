import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';

export abstract class OrderQueryPort {
  abstract findById(orderId: string): Promise<OrderReadModel | null>;
}
