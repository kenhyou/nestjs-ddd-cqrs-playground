import { Money } from '@payment/domain/vo/money.vo';

describe('Money', () => {
  it('successfully creates a money', () => {
    const money = Money.create(100, 'USD');

    expect(money.getAmount()).toBe(100);
    expect(money.getCurrency()).toBe('USD');
  });

  it('throws error when creating money with negative amount', () => {
    expect(() => Money.create(-100, 'USD')).toThrow();
  });

  it('throws error when creating money with non-finite amount', () => {
    expect(() => Money.create(Number.NaN, 'USD')).toThrow();
    expect(() => Money.create(Number.POSITIVE_INFINITY, 'USD')).toThrow();
    expect(() => Money.create(Number.NEGATIVE_INFINITY, 'USD')).toThrow();
  });

  it('throws error when creating money with empty currency', () => {
    expect(() => Money.create(100, '')).toThrow();
  });

  it('throws error when creating money with blank currency', () => {
    expect(() => Money.create(100, ' ')).toThrow();
  });

  it('throws error when adding money with different currency', () => {
    const money = Money.create(100, 'USD');
    const otherMoney = Money.create(100, 'VND');

    expect(() => money.add(otherMoney)).toThrow();
  });

  it('throws error when multiplying with negative factor', () => {
    const money = Money.create(100, 'USD');

    expect(() => money.multiply(-2)).toThrow();
  });

  it('throws error when multiplying with non-finite factor', () => {
    const money = Money.create(100, 'USD');

    expect(() => money.multiply(Number.NaN)).toThrow();
    expect(() => money.multiply(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => money.multiply(Number.NEGATIVE_INFINITY)).toThrow();
  });
});
