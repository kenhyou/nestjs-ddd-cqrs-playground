export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new Error('amount should not be less than 0');
    }

    if (!Number.isFinite(amount)) {
      throw new Error('amount must be a finite number');
    }

    if (!currency || currency.trim().length === 0) {
      throw new Error('currency is required');
    }

    return new Money(amount, currency);
  }

  equals(other: Money) {
    return this.amount === other.amount && this.currency === other.currency;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('currency must be the same');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('factor should not be less than 0');
    }
    return new Money(this.amount * factor, this.currency);
  }
}
