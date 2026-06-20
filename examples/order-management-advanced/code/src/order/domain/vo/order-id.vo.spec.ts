import { OrderId } from '@order/domain/vo/order-id.vo';

describe('OrderId', () => {
  it('should create orderId successfully', () => {
    const id = crypto.randomUUID();
    const orderId = OrderId.create(id);

    expect(orderId.getValue()).toBe(id);
  });

  it('should throw error when invalid order id is provided', () => {
    const id = 'invalid-id';

    expect(() => OrderId.create(id)).toThrow();
  });
});
