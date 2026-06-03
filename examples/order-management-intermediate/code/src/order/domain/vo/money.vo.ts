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

  multiply(multiplier: number): Money {
    return new Money(this.amount * multiplier, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private static validate(amount: number, currency: string): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(
        'Amount must be a finite number greater than or equal to 0',
      );
    }

    if (!currency) {
      throw new Error('Currency is required');
    }
  }
}
