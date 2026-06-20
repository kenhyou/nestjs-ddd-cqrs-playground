import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';
import { OrderMapper } from '@order/infra/mappers/order.mapper';

describe('OrderMapper', () => {
  it('round-trips an order with its items', () => {
    const order = Order.create('cust-1', [
      OrderItem.create(
        'prod-1',
        'Widget',
        Money.create(100, 'USD'),
        Quantity.create(2),
      ),
    ]);

    const restored = OrderMapper.toDomain(OrderMapper.toEntity(order));

    expect(restored.getOrderId().equals(order.getOrderId())).toBe(true);
    expect(restored.getCustomerId()).toBe('cust-1');
    expect(restored.getOrderStatus()).toBe(OrderStatus.PENDING);
    expect(restored.getTotalPrice().equals(Money.create(200, 'USD'))).toBe(true);

    const items = restored.getOrderItems();
    expect(items).toHaveLength(1);
    expect(items[0].getProductId()).toBe('prod-1');
    expect(items[0].getProductName()).toBe('Widget');
    expect(items[0].getQuantity().getValue()).toBe(2);
    expect(items[0].getLineTotal().equals(Money.create(200, 'USD'))).toBe(true);
  });
});
