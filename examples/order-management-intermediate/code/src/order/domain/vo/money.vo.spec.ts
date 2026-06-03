import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

describe('Money', () => {
  it('rejects a negative amount', () => {
    expect(() => Money.create(-1, 'KRW')).toThrow();
  });

  it('throw when adding different currencies', () => {
    const krw = Money.create(1000, 'KRW');
    const usd = Money.create(100, 'USD');
    expect(() => krw.add(usd)).toThrow();
  });

  it('can multiply by quantity', () => {
    const m = Money.create(1000, 'KRW');
    const multiplied = m.multiply(3);
    expect(multiplied.equals(Money.create(3000, 'KRW')));
  });

  it('can create from zero with any currency', () => {
    const zero = Money.create(0, 'JPY');
    expect(zero.getAmount()).toBe(0);
    expect(zero.getCurrency()).toBe('JPY');
  });

  it('calculates line total from unit price and quantity', () => {
    const unitPrice = Money.create(1500, 'KRW');
    const quantity = Quantity.create(3);
    const lineTotal = unitPrice.multiply(quantity.getValue());
    expect(lineTotal.getAmount()).toBe(4500);
  });

  it('equals same value and currency', () => {
    const a = Money.create(100, 'USD');
    const b = Money.create(100, 'USD');
    expect(a.equals(b)).toBe(true);
  });

  it('is not equal with different currency', () => {
    const a = Money.create(100, 'USD');
    const b = Money.create(100, 'KRW');
    expect(a.equals(b)).toBe(false);
  });

  it('is not equal with different amount', () => {
    const a = Money.create(100, 'USD');
    const b = Money.create(200, 'USD');
    expect(a.equals(b)).toBe(false);
  });
});
