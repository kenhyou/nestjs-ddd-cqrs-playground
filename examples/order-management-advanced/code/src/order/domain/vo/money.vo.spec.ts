import { Money } from '@order/domain/vo/money.vo';

describe('Money', () => {
  it('should create Money successfully', () => {
    const money = Money.create(100, 'USD');

    expect(money.getAmount()).toBe(100);
    expect(money.getCurrency()).toBe('USD');
  });

  it('should throw error when amount is negative', () => {
    expect(() => Money.create(-1, 'USD')).toThrow();
  });

  it('should throw error when amount is not a finite number', () => {
    expect(() => Money.create(Number.POSITIVE_INFINITY, 'USD')).toThrow();
  });

  it('should throw error when currency is empty', () => {
    expect(() => Money.create(100, '')).toThrow();
  });

  it('should add two Money objects with same currency', () => {
    const money = Money.create(100, 'USD');
    const otherMoney = Money.create(200, 'USD');

    const result = money.add(otherMoney);

    expect(result.getAmount()).toBe(300);
    expect(result.getCurrency()).toBe('USD');
  });

  it('should throw error when add two Money objects with different currency', () => {
    const money = Money.create(100, 'USD');
    const otherMoney = Money.create(200, 'KRW');

    expect(() => money.add(otherMoney)).toThrow();
  });

  it('should multiply money by a factor', () => {
    const money = Money.create(100, 'USD');
    const result = money.multiply(2);
    expect(result.getAmount()).toBe(200);
    expect(result.getCurrency()).toBe('USD');
  });

  it('should throw error when factor is negative', () => {
    const money = Money.create(100, 'USD');
    expect(() => money.multiply(-1)).toThrow();
  });
});
