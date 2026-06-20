import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CarrierPort,
  DispatchOutcome,
} from '@shipment/application/ports/carrier.port';

// Deliberately ugly external response the ACL must translate (D5).
type ExternalDispatchResponse = {
  statusCode: 'ACCEPTED' | 'REJECTED';
  waybillNo: string | null;
};

@Injectable()
export class MockCarrierAdapter implements CarrierPort {
  // Force-fail hook (D4c): the carrier sees only orderId (no amount sentinel),
  // so failure is config-driven — set CARRIER_FORCE_FAIL=true to make every
  // dispatch fail and exercise shipment-fail compensation. Still settable
  // directly in tests.
  forceFail: boolean;

  constructor(config: ConfigService) {
    this.forceFail = config.get<string>('CARRIER_FORCE_FAIL') === 'true';
  }

  async dispatch(input: { orderId: string }): Promise<DispatchOutcome> {
    const external = this.callExternalDispatch(input.orderId);
    // ACL translation: ugly external model → clean domain outcome.
    return {
      dispatched: external.statusCode === 'ACCEPTED',
      trackingCode: external.waybillNo ?? '',
    };
  }

  private callExternalDispatch(_orderId: string): ExternalDispatchResponse {
    if (this.forceFail) {
      return { statusCode: 'REJECTED', waybillNo: null };
    }
    return { statusCode: 'ACCEPTED', waybillNo: `WB-${randomUUID()}` };
  }
}
