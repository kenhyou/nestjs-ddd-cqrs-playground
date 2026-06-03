import { assertUuid } from '@shared/assert-uuid';

export class OrderId {
  private constructor(private readonly value: string) {}

  static create(id: string): OrderId {
    assertUuid(id, 'Id must be a valid UUID.');

    return new OrderId(id);
  }

  static generate(): OrderId {
    return new OrderId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}
