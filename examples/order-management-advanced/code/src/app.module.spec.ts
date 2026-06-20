import { Test, TestingModule } from '@nestjs/testing';
import {
  deleteDataSourceByName,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { OrderService } from '@order/application/services/order.service';
import { SagaTimeoutScheduler } from '@order/infra/scheduler/saga-timeout.scheduler';
import { MessageDispatcher } from '@outbox/relay/message-dispatcher';
import { OutboxRelayService } from '@outbox/relay/outbox-relay.service';
import { PaymentService } from '@payment/application/services/payment.service';
import { ShipmentService } from '@shipment/application/services/shipment.service';
import { AppModule } from './app.module';

describe('AppModule (DI smoke)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    initializeTransactionalContext();
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef?.close();
    deleteDataSourceByName('default');
  });

  it('wires the whole graph and resolves the facades, relay, dispatcher, and scheduler', () => {
    expect(moduleRef.get(OrderService)).toBeInstanceOf(OrderService);
    expect(moduleRef.get(PaymentService)).toBeInstanceOf(PaymentService);
    expect(moduleRef.get(ShipmentService)).toBeInstanceOf(ShipmentService);
    expect(moduleRef.get(OutboxRelayService)).toBeInstanceOf(OutboxRelayService);
    expect(moduleRef.get(MessageDispatcher)).toBeInstanceOf(MessageDispatcher);
    expect(moduleRef.get(SagaTimeoutScheduler)).toBeInstanceOf(
      SagaTimeoutScheduler,
    );
  });
});
