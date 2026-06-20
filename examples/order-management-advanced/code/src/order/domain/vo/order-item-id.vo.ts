import { assertUuid } from '@shared/assert-uuid';

export class OrderItemId {
  private constructor(private readonly value: string) {}

  static create(id: string): OrderItemId {
    assertUuid(id, 'Invalid OrderItemId');

    return new OrderItemId(id);
  }

  static generate(): OrderItemId {
    return new OrderItemId(crypto.randomUUID());
  }

  equals(other: OrderItemId): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
