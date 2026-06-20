import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ShipmentService } from '@shipment/application/services/shipment.service';
import { ShipmentController } from '@shipment/presenters/http/controllers/shipment.controller';

const UUID = '33333333-3333-4333-8333-333333333333';

describe('ShipmentController (e2e)', () => {
  let app: INestApplication;
  const shipmentService = { getShipment: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ShipmentController],
      providers: [{ provide: ShipmentService, useValue: shipmentService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /shipments/:id returns the read model', async () => {
    const readModel = { id: UUID, status: 'DISPATCHED', trackingCode: 'WB-1' };
    shipmentService.getShipment.mockResolvedValue(readModel);

    await request(app.getHttpServer())
      .get(`/shipments/${UUID}`)
      .expect(200)
      .expect(readModel);
  });

  it('GET /shipments/:id rejects a non-uuid id (400)', async () => {
    await request(app.getHttpServer()).get('/shipments/nope').expect(400);
  });
});
