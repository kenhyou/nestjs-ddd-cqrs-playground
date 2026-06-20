export class OrderItemReadModel {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export class OrderReadModel {
  id: string;
  customerId: string;
  status: string; // OrderStatus serialized as string
  paymentStatus: string; // denormalized — filled by saga wiring later
  shipmentStatus: string; // denormalized
  totalPrice: number;
  items: OrderItemReadModel[];
}
