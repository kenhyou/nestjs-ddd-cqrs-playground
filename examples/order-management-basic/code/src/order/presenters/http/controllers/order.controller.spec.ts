import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrderController } from '@order/presenters/http/controllers/order.controller';
import { OrderService } from '@order/application/services/order.service';

describe('OrderController (e2e)', () => {
  let app: INestApplication;

  const orderService = {
    createOrder: jest.fn(),
    addOrderItem: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
    shipOrder: jest.fn(),
    getOrder: jest.fn(),
  };

  const validBody = {
    customerId: 'c1',
    items: [{ name: 'A', quantity: 2, unitPrice: 100, currency: 'KRW' }],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: orderService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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

    it('a rejected payload never reaches the service', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ customerId: 'c1', items: [] })
        .expect(400);
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('POST /orders/:id/items', () => {
    it('valid → delegates (id + fields)', async () => {
      await request(app.getHttpServer())
        .post('/orders/o1/items')
        .send({ name: 'B', quantity: 3, unitPrice: 200, currency: 'KRW' })
        .expect(201);

      expect(orderService.addOrderItem).toHaveBeenCalledWith(
        'o1',
        'B',
        3,
        200,
        'KRW',
      );
    });

    it('quantity < 1 → 400', () =>
      request(app.getHttpServer())
        .post('/orders/o1/items')
        .send({ name: 'B', quantity: 0, unitPrice: 200, currency: 'KRW' })
        .expect(400));
  });

  describe('state-transition endpoints delegate', () => {
    it('POST /orders/:id/confirm', async () => {
      await request(app.getHttpServer()).post('/orders/o1/confirm').expect(201);
      expect(orderService.confirmOrder).toHaveBeenCalledWith('o1');
    });

    it('POST /orders/:id/cancel', async () => {
      await request(app.getHttpServer()).post('/orders/o1/cancel').expect(201);
      expect(orderService.cancelOrder).toHaveBeenCalledWith('o1');
    });

    it('POST /orders/:id/ship', async () => {
      await request(app.getHttpServer()).post('/orders/o1/ship').expect(201);
      expect(orderService.shipOrder).toHaveBeenCalledWith('o1');
    });
  });

  describe('GET /orders/:id', () => {
    it('returns the read model from the service unchanged', async () => {
      const readModel = { orderId: 'o1', status: 'PENDING' };
      orderService.getOrder.mockResolvedValue(readModel);

      const res = await request(app.getHttpServer())
        .get('/orders/o1')
        .expect(200);

      expect(res.body).toEqual(readModel);
    });
  });
});
