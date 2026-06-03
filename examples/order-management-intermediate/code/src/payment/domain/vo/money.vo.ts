export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    this.validate(amount, currency);

    return new Money(amount, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }

    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(rate: number): Money {
    return new Money(this.amount * rate, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  static validate(amount: number, currency: string) {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error('amount must be greater than 0');

    if (!currency) throw new Error('currency must be string');
  }
}
