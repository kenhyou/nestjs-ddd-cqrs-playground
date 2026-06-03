const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class OrderId {
  private constructor(private readonly value: string) {}

  static generate(): OrderId {
    return new OrderId(crypto.randomUUID());
  }

  static create(value: string): OrderId {
    if (!UUID_REGEX.test(value)) {
      throw new Error('id should be an UUID');
    }

    return new OrderId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}
