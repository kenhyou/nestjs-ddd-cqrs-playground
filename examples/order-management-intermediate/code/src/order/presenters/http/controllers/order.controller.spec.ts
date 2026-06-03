import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrderController } from '@order/presenters/http/controllers/order.controller';
import { OrderService } from '@order/application/services/order.service';
import { DomainExceptionFilter } from '@shared/filters/domain-exception.filter';

describe('OrderController (e2e)', () => {
  let app: INestApplication;

  const orderService = {
    createOrder: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
    shipOrder: jest.fn(),
    getOrder: jest.fn(),
  };

  const UUID = '11111111-1111-1111-1111-111111111111';
  const validBody = {
    customerId: 'c1',
    items: [
      {
        productId: 'p1',
        productName: 'Widget',
        unitPrice: 1000,
        currency: 'KRW',
        quantity: 2,
      },
    ],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: orderService }],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same pipeline as main.ts, so the test exercises the real edge behaviour.
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

  describe('POST /orders', () => {
    it('valid → 201 with { orderId } and delegates once', async () => {
      orderService.createOrder.mockResolvedValue('order-1');

      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(validBody)
        .expect(201);

      expect(res.body).toEqual({ orderId: 'order-1' });
      expect(orderService.createOrder).toHaveBeenCalledTimes(1);
      expect(orderService.createOrder).toHaveBeenCalledWith('c1', validBody.items);
    });

    it('empty items → 400 (ArrayNotEmpty)', () =>
      request(app.getHttpServer())
        .post('/orders')
        .send({ customerId: 'c1', items: [] })
        .expect(400));

    it('unknown property → 400 (forbidNonWhitelisted)', () =>
      request(app.getHttpServer())
        .post('/orders')
        .send({ ...validBody, hacker: 'x' })
        .expect(400));

    it('nested quantity < 1 → 400 (@ValidateNested + @Min)', () =>
      request(app.getHttpServer())
        .post('/orders')
        .send({
          customerId: 'c1',
          items: [{ ...validBody.items[0], quantity: 0 }],
        })
        .expect(400));

    it('missing customerId → 400', () =>
      request(app.getHttpServer())
        .post('/orders')
        .send({ items: validBody.items })
        .expect(400));

    it('a rejected payload never reaches the service', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ customerId: 'c1', items: [] })
        .expect(400);
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('POST /orders/:id/confirm', () => {
    it('valid uuid → 201 and delegates (id, paymentMethod)', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${UUID}/confirm`)
        .send({ paymentMethod: 'CARD' })
        .expect(201);

      expect(orderService.confirmOrder).toHaveBeenCalledWith(UUID, 'CARD');
    });

    it('malformed uuid → 400 (ParseUUIDPipe) before the handler', async () => {
      await request(app.getHttpServer())
        .post('/orders/not-a-uuid/confirm')
        .send({ paymentMethod: 'CARD' })
        .expect(400);

      expect(orderService.confirmOrder).not.toHaveBeenCalled();
    });

    it('missing paymentMethod → 400', () =>
      request(app.getHttpServer())
        .post(`/orders/${UUID}/confirm`)
        .send({})
        .expect(400));
  });

  describe('GET /orders/:id', () => {
    it('returns the read model from the service unchanged', async () => {
      const readModel = { orderId: UUID, status: 'PENDING' };
      orderService.getOrder.mockResolvedValue(readModel);

      const res = await request(app.getHttpServer())
        .get(`/orders/${UUID}`)
        .expect(200);

      expect(res.body).toEqual(readModel);
    });

    it('malformed uuid → 400 (ParseUUIDPipe)', () =>
      request(app.getHttpServer()).get('/orders/bad').expect(400));
  });
});
