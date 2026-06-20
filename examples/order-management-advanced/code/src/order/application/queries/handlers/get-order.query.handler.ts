import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderQuery } from '@order/application/queries/get-order.query';
import { OrderNotFoundException } from '@order/domain/exceptions/order.exceptions';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';

@QueryHandler(GetOrderQuery)
export class GetOrderQueryHandler implements IQueryHandler<
  GetOrderQuery,
  OrderReadModel
> {
  constructor(private readonly orderQuery: OrderQueryPort) {}

  async execute(query: GetOrderQuery): Promise<OrderReadModel> {
    const order = await this.orderQuery.findById(query.orderId);
    if (!order) {
      throw new OrderNotFoundException(query.orderId);
    }
    return order;
  }
}
