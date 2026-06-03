import { Quantity } from '@order/domain/vo/quantity.vo';

describe('Quantity', () => {
  it('create a quantity', () => {
    const quantity = Quantity.create(2);
    expect(quantity.getValue()).toBe(2);
  });

  it('Quantity must be a positive integer', () => {
    expect(() => Quantity.create(0)).toThrow(
      'Quantity must be a positive integer',
    );
    expect(() => Quantity.create(-1)).toThrow(
      'Quantity must be a positive integer',
    );
  });
});
