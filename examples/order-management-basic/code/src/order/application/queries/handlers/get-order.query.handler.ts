import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderQuery } from '@order/application/queries/get-order.query';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';

@QueryHandler(GetOrderQuery)
export class GetOrderQueryHandler implements IQueryHandler<
  GetOrderQuery,
  OrderReadModel | null
> {
  constructor(private readonly queryPort: OrderQueryPort) {}

  async execute(query: GetOrderQuery): Promise<OrderReadModel | null> {
    return this.queryPort.findById(query.orderId);
  }
}
