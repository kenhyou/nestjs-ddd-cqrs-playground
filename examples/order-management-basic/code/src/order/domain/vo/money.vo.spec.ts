import { Money } from '@order/domain/vo/money.vo';

describe('Money', () => {
  describe('create', () => {
    it('should create a new money object when amount is non-negative and currency is non-empty', () => {
      const money = Money.create(100, 'KRW');
      expect(money).toBeInstanceOf(Money);
      expect(money.getAmount()).toBe(100);
      expect(money.getCurrency()).toBe('KRW');
    });

    it('should throw an error when amount is negative', () => {
      expect(() => Money.create(-100, 'KRW')).toThrow(
        'amount should be non-negative',
      );
    });
  });

  describe('equals', () => {
    it('should return true when two money objects have the same amount and currency', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(100, 'KRW');
      expect(money.equals(money2)).toBe(true);
    });

    it('should return false when two money objects have different amounts', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(200, 'KRW');
      expect(money.equals(money2)).toBe(false);
    });

    it('should return false when two money objects have different currencies', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(100, 'USD');
      expect(money.equals(money2)).toBe(false);
    });
  });

  describe('add', () => {
    it('should return a new money object when two money objects have the same currency', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(200, 'KRW');
      const result = money.add(money2);
      expect(result).toBeInstanceOf(Money);
      expect(result.getAmount()).toBe(300);
      expect(result.getCurrency()).toBe('KRW');
    });

    it('should throw an error when two money objects have different currencies', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(200, 'USD');
      expect(() => money.add(money2)).toThrow('currency should be same');
    });
  });

  describe('subtract', () => {
    it('should return a new money object when two money objects have the same currency', () => {
      const money = Money.create(200, 'KRW');
      const money2 = Money.create(100, 'KRW');
      const result = money.subtract(money2);
      expect(result).toBeInstanceOf(Money);
      expect(result.getAmount()).toBe(100);
      expect(result.getCurrency()).toBe('KRW');
    });

    it('should throw an error when two money objects have different currencies', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(200, 'USD');
      expect(() => money.subtract(money2)).toThrow('currency should be same');
    });

    it('should throw an error when the amount of the first money object is less than the amount of the second money object', () => {
      const money = Money.create(100, 'KRW');
      const money2 = Money.create(200, 'KRW');
      expect(() => money.subtract(money2)).toThrow(
        'amount should be non-negative',
      );
    });
  });

  describe('multiply', () => {
    it('should return a new money object when multiplied by a number', () => {
      const money = Money.create(100, 'KRW');
      const result = money.multiply(2);
      expect(result).toBeInstanceOf(Money);
      expect(result.getAmount()).toBe(200);
      expect(result.getCurrency()).toBe('KRW');
    });
  });
});
