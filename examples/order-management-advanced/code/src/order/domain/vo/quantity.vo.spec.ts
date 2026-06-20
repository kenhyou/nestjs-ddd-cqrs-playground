import { Quantity } from '@order/domain/vo/quantity.vo';

describe('Quantity', () => {
  it('should create Quantity successfully', () => {
    const quantity = Quantity.create(10);

    expect(quantity.getValue()).toBe(10);
  });

  it('should throw error when quantity is less than or equal to 0', () => {
    expect(() => Quantity.create(0)).toThrow();
  });

  it('should throw error when quantity is not an integer', () => {
    expect(() => Quantity.create(10.5)).toThrow();
  });
});
