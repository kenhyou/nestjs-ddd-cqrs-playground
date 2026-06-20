export class Quantity {
  private constructor(private readonly value: number) {}

  static create(value: number): Quantity {
    if (value <= 0) {
      throw new Error('value must be greater than 0');
    }

    if (!Number.isInteger(value)) {
      throw new Error('value must be an integer');
    }

    return new Quantity(value);
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  getValue(): number {
    return this.value;
  }
}
