import { OrderItemInput } from '@order/domain/factories/order.factory';

export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemInput[],
  ) {}
}
