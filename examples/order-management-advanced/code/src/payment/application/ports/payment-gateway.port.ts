export type PaymentOutcome = {
  settled: boolean;
  gatewayRef: string;
};

export type RefundOutcome = {
  refunded: boolean;
};

export abstract class PaymentGatewayPort {
  abstract charge(input: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentOutcome>;

  abstract refund(input: { gatewayRef: string }): Promise<RefundOutcome>;
}
