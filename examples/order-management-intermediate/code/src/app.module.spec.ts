import { rmSync } from 'fs';
import { TestingModule, Test } from '@nestjs/testing';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { OrderService } from '@order/application/services/order.service';
import { PaymentService } from '@payment/application/services/payment.service';
import { ConfirmOrderCommandHandler } from '@order/application/commands/handlers/confirm-order.command.handler';
import { ShipOrderCommandHandler } from '@order/application/commands/handlers/ship-order.command.handler';
import { OrderRepositoryPort } from '@order/application/ports/order.repository.port';
import { PaymentCommandPort } from '@order/application/ports/payment-command.port';
import { Order } from '@order/domain/models/order.model';

// Stand-in binding to prove the port token can be overridden at the DI boundary.
class InMemoryOrderRepository implements OrderRepositoryPort {
  async save(): Promise<void> {}
  async findById(): Promise<Order | null> {
    return null;
  }
}

describe('AppModule (DI smoke)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    initializeTransactionalContext(); // required before AppModule's addTransactionalDataSource
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OrderRepositoryPort)
      .useClass(InMemoryOrderRepository)
      .compile();
  });

  afterAll(async () => {
    await moduleRef.close();
    rmSync('order-management.sqlite', { force: true });
  });

  it('resolves the whole graph (facades + handlers)', () => {
    expect(moduleRef.get(OrderService)).toBeDefined();
    expect(moduleRef.get(PaymentService)).toBeDefined();
    expect(moduleRef.get(ConfirmOrderCommandHandler)).toBeDefined();
    expect(moduleRef.get(ShipOrderCommandHandler)).toBeDefined();
  });

  it('wires the cross-BC ACL port (PaymentCommandPort resolvable in Order graph)', () => {
    // Proves PaymentPortsModule exported the bound adapter and OrderModule consumes it.
    expect(moduleRef.get(PaymentCommandPort)).toBeDefined();
  });

  it('honours .overrideProvider on a Port token', () => {
    expect(moduleRef.get(OrderRepositoryPort)).toBeInstanceOf(InMemoryOrderRepository);
  });
});
