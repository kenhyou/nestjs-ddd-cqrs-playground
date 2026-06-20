import { assertUuid } from '@shared/assert-uuid';

export class PaymentId {
  private constructor(private readonly value: string) {}

  static create(id: string): PaymentId {
    assertUuid(id, 'Invalid payment id.');
    return new PaymentId(id);
  }

  static generate(): PaymentId {
    return new PaymentId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PaymentId): boolean {
    return this.value === other.value;
  }
}
