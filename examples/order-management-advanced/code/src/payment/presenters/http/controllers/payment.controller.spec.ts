import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PaymentService } from '@payment/application/services/payment.service';
import { PaymentController } from '@payment/presenters/http/controllers/payment.controller';

const UUID = '22222222-2222-4222-8222-222222222222';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
  const paymentService = { getPayment: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: paymentService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /payments/:id returns the read model', async () => {
    const readModel = { id: UUID, status: 'SUCCEEDED' };
    paymentService.getPayment.mockResolvedValue(readModel);

    await request(app.getHttpServer())
      .get(`/payments/${UUID}`)
      .expect(200)
      .expect(readModel);
  });

  it('GET /payments/:id rejects a non-uuid id (400)', async () => {
    await request(app.getHttpServer()).get('/payments/nope').expect(400);
  });
});
