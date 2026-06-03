import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PaymentController } from '@payment/presenters/http/controllers/payment.controller';
import { PaymentService } from '@payment/application/services/payment.service';
import { DomainExceptionFilter } from '@shared/filters/domain-exception.filter';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;

  const paymentService = {
    settlePayment: jest.fn(),
    issueRefund: jest.fn(),
    getPayment: jest.fn(),
  };

  const UUID = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: paymentService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /payments/:id/settle', () => {
    it('valid result → 201 and delegates (id, result)', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${UUID}/settle`)
        .send({ result: 'SUCCEEDED' })
        .expect(201);

      expect(paymentService.settlePayment).toHaveBeenCalledWith(UUID, 'SUCCEEDED');
    });

    it('result outside the union → 400 (@IsIn)', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${UUID}/settle`)
        .send({ result: 'MAYBE' })
        .expect(400);

      expect(paymentService.settlePayment).not.toHaveBeenCalled();
    });

    it('malformed uuid → 400 (ParseUUIDPipe)', () =>
      request(app.getHttpServer())
        .post('/payments/bad/settle')
        .send({ result: 'SUCCEEDED' })
        .expect(400));
  });

  describe('POST /payments/:id/refund', () => {
    it('valid uuid → 201 and delegates', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${UUID}/refund`)
        .expect(201);

      expect(paymentService.issueRefund).toHaveBeenCalledWith(UUID);
    });

    it('malformed uuid → 400', () =>
      request(app.getHttpServer()).post('/payments/bad/refund').expect(400));
  });

  describe('GET /payments/:id', () => {
    it('returns the read model unchanged', async () => {
      const readModel = { paymentId: UUID, status: 'SUCCEEDED' };
      paymentService.getPayment.mockResolvedValue(readModel);

      const res = await request(app.getHttpServer())
        .get(`/payments/${UUID}`)
        .expect(200);

      expect(res.body).toEqual(readModel);
    });
  });
});
