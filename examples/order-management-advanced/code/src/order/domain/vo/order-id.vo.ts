import { assertUuid } from '@shared/assert-uuid';

export class OrderId {
  private constructor(private readonly value: string) {}

  static create(id: string): OrderId {
    assertUuid(id, 'Invalid OrderId');

    return new OrderId(id);
  }

  static generate(): OrderId {
    return new OrderId(crypto.randomUUID());
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
