export class PaymentReadModel {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string; // PaymentMethod serialized as string
  status: string; // PaymentStatus serialized as string
  gatewayRef: string | null;
}
