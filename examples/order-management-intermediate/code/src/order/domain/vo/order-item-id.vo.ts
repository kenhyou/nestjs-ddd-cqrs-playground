import { assertUuid } from '@shared/assert-uuid';

export class OrderItemId {
  private constructor(private readonly value: string) {}

  static create(id: string): OrderItemId {
    assertUuid(id, 'Id must be a valid UUID.');

    return new OrderItemId(id);
  }

  static generate(): OrderItemId {
    return new OrderItemId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderItemId): boolean {
    return this.value === other.value;
  }
}
