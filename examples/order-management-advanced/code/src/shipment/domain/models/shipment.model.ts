import { AggregateRoot } from '@shared/domain/aggregate-root';
import { ShipmentStatus } from '@shipment/domain/enums/shipment-status.enum';
import { ShipmentDeliveredEvent } from '@shipment/domain/events/shipment-delivered.event';
import { ShipmentDispatchedEvent } from '@shipment/domain/events/shipment-dispatched.event';
import { ShipmentFailedEvent } from '@shipment/domain/events/shipment-failed.event';
import { InvalidShipmentStateException } from '@shipment/domain/exceptions/shipment.exceptions';
import { ShipmentId } from '@shipment/domain/vo/shipment-id.vo';
import { TrackingCode } from '@shipment/domain/vo/tracking-code.vo';

export class Shipment extends AggregateRoot {
  private constructor(
    private readonly id: ShipmentId,
    private readonly orderId: string,
    private status: ShipmentStatus,
    private trackingCode: TrackingCode | null = null,
  ) {
    super();
  }

  static create(orderId: string): Shipment {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error('Order ID is required');
    }
    const shipment = new Shipment(
      ShipmentId.generate(),
      orderId,
      ShipmentStatus.PENDING,
    );

    return shipment;
  }

  static reconstitute(
    id: ShipmentId,
    orderId: string,
    status: ShipmentStatus,
    trackingCode: string | null = null,
  ): Shipment {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error('Order ID is required');
    }

    return new Shipment(
      id,
      orderId,
      status,
      trackingCode ? TrackingCode.create(trackingCode) : null,
    );
  }

  dispatch(trackingCode: string): void {
    if (this.status !== ShipmentStatus.PENDING) {
      throw new InvalidShipmentStateException(
        'Cannot dispatch shipment that is not in pending state',
      );
    }

    this.trackingCode = TrackingCode.create(trackingCode);

    this.status = ShipmentStatus.DISPATCHED;
    this.record(
      new ShipmentDispatchedEvent(
        this.id.getValue(),
        this.orderId,
        trackingCode,
      ),
    );
  }

  deliver(): void {
    if (this.status !== ShipmentStatus.DISPATCHED) {
      throw new InvalidShipmentStateException(
        'Cannot deliver shipment that is not in dispatched state',
      );
    }

    this.status = ShipmentStatus.DELIVERED;

    this.record(new ShipmentDeliveredEvent(this.id.getValue(), this.orderId));
  }

  fail(): void {
    if (this.status !== ShipmentStatus.PENDING) {
      throw new InvalidShipmentStateException(
        'Cannot fail shipment that is not in pending state',
      );
    }

    this.status = ShipmentStatus.FAILED;

    this.record(new ShipmentFailedEvent(this.id.getValue(), this.orderId));
  }

  getShipmentId(): ShipmentId {
    return this.id;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getShipmentStatus(): ShipmentStatus {
    return this.status;
  }

  getTrackingCode(): TrackingCode | null {
    return this.trackingCode;
  }
}
