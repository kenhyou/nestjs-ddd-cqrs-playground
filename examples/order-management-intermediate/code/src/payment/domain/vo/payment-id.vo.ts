import { assertUuid } from '@shared/assert-uuid';

export class PaymentId {
  private constructor(private readonly value: string) {}

  static create(id: string): PaymentId {
    assertUuid(id, 'id must be a valid uuid');

    return new PaymentId(id);
  }

  static generate(): PaymentId {
    const id = crypto.randomUUID();
    return new PaymentId(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PaymentId): boolean {
    return this.value === other.value;
  }
}
