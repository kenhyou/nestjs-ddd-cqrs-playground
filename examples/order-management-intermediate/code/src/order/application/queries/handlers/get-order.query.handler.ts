import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderQueryPort } from '@order/application/ports/order.query.port';
import { OrderReadModel } from '@order/application/queries/dtos/order.read-model';
import { GetOrderQuery } from '@order/application/queries/get-order.query';

@QueryHandler(GetOrderQuery)
export class GetOrderQueryHandler implements IQueryHandler<
  GetOrderQuery,
  OrderReadModel | null
> {
  constructor(private readonly orderQueryPort: OrderQueryPort) {}

  execute(query: GetOrderQuery): Promise<OrderReadModel | null> {
    return this.orderQueryPort.findById(query.orderId);
  }
}
