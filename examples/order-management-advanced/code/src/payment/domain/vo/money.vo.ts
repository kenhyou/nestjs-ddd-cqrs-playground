export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0 || !Number.isFinite(amount)) {
      throw new Error('Invalid amount.');
    }

    if (currency.trim().length === 0) {
      throw new Error('Invalid currency.');
    }

    return new Money(amount, currency);
  }

  equals(other: Money): boolean {
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
      throw new Error('Currency mismatch.');
    }

    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0 || !Number.isFinite(factor)) {
      throw new Error('Invalid factor.');
    }

    return new Money(this.amount * factor, this.currency);
  }
}
