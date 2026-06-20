import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrderService } from '@order/application/services/order.service';
import { OrderController } from '@order/presenters/http/controllers/order.controller';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  const orderService = {
    createOrder: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getOrder: jest.fn(),
  };

  const validBody = () => ({
    customerId: 'cust-1',
    items: [
      {
        productId: 'prod-1',
        productName: 'Widget',
        unitPrice: 100,
        currency: 'USD',
        quantity: 2,
      },
    ],
  });

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

  it('POST /orders creates an order and returns its id', async () => {
    orderService.createOrder.mockResolvedValue(UUID);

    await request(app.getHttpServer())
      .post('/orders')
      .send(validBody())
      .expect(201)
      .expect({ orderId: UUID });

    expect(orderService.createOrder).toHaveBeenCalledWith('cust-1', [
      expect.objectContaining({ productId: 'prod-1', quantity: 2 }),
    ]);
  });

  it('POST /orders rejects a body with no items (400)', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ customerId: 'cust-1', items: [] })
      .expect(400);

    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it('POST /orders rejects an unknown property (400)', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ ...validBody(), bogus: true })
      .expect(400);
  });

  it('GET /orders/:id returns the read model', async () => {
    const readModel = { id: UUID, status: 'PENDING' };
    orderService.getOrder.mockResolvedValue(readModel);

    await request(app.getHttpServer())
      .get(`/orders/${UUID}`)
      .expect(200)
      .expect(readModel);
  });

  it('GET /orders/:id rejects a non-uuid id (400)', async () => {
    await request(app.getHttpServer()).get('/orders/not-a-uuid').expect(400);
    expect(orderService.getOrder).not.toHaveBeenCalled();
  });

  it('POST /orders/:id/confirm and /cancel return 200', async () => {
    orderService.confirmOrder.mockResolvedValue(undefined);
    orderService.cancelOrder.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post(`/orders/${UUID}/confirm`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/orders/${UUID}/cancel`)
      .expect(200);

    expect(orderService.confirmOrder).toHaveBeenCalledWith(UUID);
    expect(orderService.cancelOrder).toHaveBeenCalledWith(UUID);
  });
});
