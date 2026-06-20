import {
  DomainException,
  DomainExceptionCategory,
} from '@shared/exceptions/domain-exception';

export class ShipmentNotFoundException extends DomainException {
  readonly category = DomainExceptionCategory.NOT_FOUND;

  constructor(shipmentId: string) {
    super(`Shipment not found: ${shipmentId}`);
  }
}

export class InvalidShipmentStateException extends DomainException {
  readonly category = DomainExceptionCategory.CONFLICT;

  constructor(message: string) {
    super(message);
  }
}
