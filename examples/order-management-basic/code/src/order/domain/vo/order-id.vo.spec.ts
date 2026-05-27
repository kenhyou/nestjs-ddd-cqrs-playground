import { OrderId } from '@order/domain/vo/order-id.vo';

describe('OrderId', () => {
  describe('create', () => {
    it('should throw an error when id is empty', () => {
      expect(() => OrderId.create('')).toThrow('id should be an UUID');
    });

    it('should throw an error when id is not a valid UUID', () => {
      expect(() => OrderId.create('invalid-id')).toThrow(
        'id should be an UUID',
      );
    });

    it('should create a new OrderId when id is a valid UUID', () => {
      const id = OrderId.create('550e8400-e29b-41d4-a716-446655440000');
      expect(id).toBeInstanceOf(OrderId);
      expect(id.getValue()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should generate a new UUID when id is not provided', () => {
      const id = OrderId.create();
      expect(id).toBeInstanceOf(OrderId);
      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('equals', () => {
    it('should return true when two OrderIds have the same value', () => {
      const id = OrderId.create('550e8400-e29b-41d4-a716-446655440000');
      const id2 = OrderId.create('550e8400-e29b-41d4-a716-446655440000');
      expect(id.equals(id2)).toBe(true);
    });

    it('should return false when two OrderIds have different values', () => {
      const id = OrderId.create('550e8400-e29b-41d4-a716-446655440000');
      const id2 = OrderId.create('123e4567-e89b-42d3-a456-426614174000');
      expect(id.equals(id2)).toBe(false);
    });
  });
});
