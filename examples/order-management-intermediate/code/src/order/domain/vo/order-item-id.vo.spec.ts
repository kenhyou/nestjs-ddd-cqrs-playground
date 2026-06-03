import { OrderItemId } from '@order/domain/vo/order-item-id.vo';

describe('OrderItemId', () => {
  it('should create OrderItemId', () => {
    const orderItemId = OrderItemId.create(
      '123e4567-e89b-12d3-a456-426614174000',
    );
    expect(orderItemId.getValue()).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw error when id is not a valid UUID', () => {
    expect(() => OrderItemId.create('invalid-uuid')).toThrow(
      'Id must be a valid UUID.',
    );
  });
});
