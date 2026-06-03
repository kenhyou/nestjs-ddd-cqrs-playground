import { Money } from '@payment/domain/vo/money.vo';

describe('Money', () => {
  it('should create Money with valid arguments', () => {
    const money = Money.create(1000, 'KRW');

    expect(money.getAmount()).toBe(1000);
    expect(money.getCurrency()).toBe('KRW');
  });

  it('should throw error when amount is negative', () => {
    expect(() => Money.create(-1000, 'KRW')).toThrow();
  });

  it('should throw error when amount is not a number', () => {
    expect(() => Money.create(NaN, 'KRW')).toThrow();
  });

  it('should throw error when currency is empty', () => {
    expect(() => Money.create(1000, '')).toThrow();
  });
});
