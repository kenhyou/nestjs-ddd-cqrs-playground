import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';

describe('OrderMapper', () => {
  const mapper = new OrderMapper(new OrderItemMapper());

  it('round-trips toDomain(toOrm(order)) losslessly', () => {
    const order = Order.create('c1', [
      OrderItem.create('A', Money.create(100, 'KRW'), 2),
      OrderItem.create('B', Money.create(200, 'KRW'), 1),
    ]);

    const restored = mapper.toDomain(mapper.toOrm(order));

    expect(restored.getOrderId().getValue()).toBe(order.getOrderId().getValue());
    expect(restored.getCustomerId()).toBe('c1');
    expect(restored.getOrderStatus()).toBe(OrderStatus.PENDING);
    expect(restored.getTotalPrice().getAmount()).toBe(400);
    expect(restored.getTotalPrice().getCurrency()).toBe('KRW');
    expect(restored.getOrderItems()).toHaveLength(2);
    expect(restored.getOrderItems()[0].getName()).toBe('A');
    expect(restored.getOrderItems()[0].getQuantity()).toBe(2);
  });
});
