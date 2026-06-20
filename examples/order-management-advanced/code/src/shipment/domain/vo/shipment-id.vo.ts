import { assertUuid } from '@shared/assert-uuid';

export class ShipmentId {
  private constructor(private readonly value: string) {}

  static create(id: string): ShipmentId {
    assertUuid(id, 'Invalid shipment Id');

    return new ShipmentId(id);
  }

  static generate(): ShipmentId {
    return new ShipmentId(crypto.randomUUID());
  }

  equals(other: ShipmentId): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
