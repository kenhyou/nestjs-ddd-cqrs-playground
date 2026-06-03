import { OrderId } from '@order/domain/vo/order-id.vo';

describe('OrderId', () => {
  it('should create an OrderId', () => {
    const id = OrderId.create('123e4567-e89b-12d3-a456-426614174000');
    expect(id.getValue()).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw error when id is not a valid UUID', () => {
    expect(() => OrderId.create('invalid-UUID')).toThrow(
      'Id must be a valid UUID.',
    );
  });
});
