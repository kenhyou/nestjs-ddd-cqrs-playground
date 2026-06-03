import { OrderFactory } from '@order/domain/factories/order.factory';
import { OrderItemMapper } from '@order/infra/mappers/order-item.mapper';
import { OrderMapper } from '@order/infra/mappers/order.mapper';

describe('OrderMapper', () => {
  const mapper = new OrderMapper(new OrderItemMapper());

  it('round-trips an order losslessly', () => {
    const order = new OrderFactory().create('c1', [
      {
        productId: 'p1',
        productName: 'P',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ]);

    const restored = mapper.toDomain(mapper.toOrm(order));

    expect(restored.getOrderId().getValue()).toBe(
      order.getOrderId().getValue(),
    );
    expect(restored.getCustomerId()).toBe('c1');
    expect(restored.getOrderStatus()).toBe(order.getOrderStatus());
    expect(restored.getTotalPrice().getAmount()).toBe(2000);
    expect(restored.getTotalPrice().getCurrency()).toBe('KRW');
    expect(restored.getOrderItems()).toHaveLength(1);
    expect(restored.getOrderItems()[0].getTotalPrice().getAmount()).toBe(2000);
  });
});
