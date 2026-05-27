export class CreateOrderRequest {
  customerId: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }[];
}
