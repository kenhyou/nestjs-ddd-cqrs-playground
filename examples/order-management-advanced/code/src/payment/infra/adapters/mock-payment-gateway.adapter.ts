import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  PaymentGatewayPort,
  PaymentOutcome,
  RefundOutcome,
} from '@payment/application/ports/payment-gateway.port';

// Amount sentinel that forces a decline — drives the compensation tests (D4c).
export const FORCE_FAIL_AMOUNT = 99999;

// Deliberately ugly external responses the ACL must translate (D5).
type ExternalChargeResponse = {
  txnId: string;
  resultCode: 'APPROVED' | 'DECLINED';
  rawStatus: string;
};
type ExternalRefundResponse = { rawStatus: string };

@Injectable()
export class MockPaymentGatewayAdapter implements PaymentGatewayPort {
  async charge(input: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentOutcome> {
    const external = this.callExternalCharge(input.amount);
    // ACL translation: ugly external model → clean domain outcome.
    return {
      settled: external.resultCode === 'APPROVED',
      gatewayRef: external.txnId,
    };
  }

  async refund(input: { gatewayRef: string }): Promise<RefundOutcome> {
    const external = this.callExternalRefund(input.gatewayRef);
    return { refunded: external.rawStatus === 'REFUND_OK' };
  }

  private callExternalCharge(amount: number): ExternalChargeResponse {
    const approved = amount !== FORCE_FAIL_AMOUNT;
    return {
      txnId: `gw_${randomUUID()}`,
      resultCode: approved ? 'APPROVED' : 'DECLINED',
      rawStatus: approved ? 'OK' : 'INSUFFICIENT_FUNDS',
    };
  }

  private callExternalRefund(_gatewayRef: string): ExternalRefundResponse {
    return { rawStatus: 'REFUND_OK' };
  }
}
