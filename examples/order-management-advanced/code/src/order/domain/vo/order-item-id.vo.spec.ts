import { OrderItemId } from '@order/domain/vo/order-item-id.vo';

describe('OrderItemId', () => {
  it('should create orderItemId successfully', () => {
    const id = crypto.randomUUID();
    const orderItemId = OrderItemId.create(id);

    expect(orderItemId.getValue()).toBe(id);
  });

  it('should throw error when invalid order item id is provided', () => {
    const id = 'invalid-id';

    expect(() => OrderItemId.create(id)).toThrow();
  });
});
