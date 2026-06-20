export type DispatchOutcome = { dispatched: boolean; trackingCode: string };

export abstract class CarrierPort {
  abstract dispatch(input: { orderId: string }): Promise<DispatchOutcome>;
}
