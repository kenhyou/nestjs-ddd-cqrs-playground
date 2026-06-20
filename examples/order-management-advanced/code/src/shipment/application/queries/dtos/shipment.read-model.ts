export class ShipmentReadModel {
  id: string;
  orderId: string;
  status: string; // ShipmentStatus serialized as string
  trackingCode: string | null;
}
