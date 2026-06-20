import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrderService } from '@order/application/services/order.service';
import {
  InvalidOrderStateException,
  OrderNotCancellableException,
  OrderNotFoundException,
} from '@order/domain/exceptions/order.exceptions';
import { OrderController } from '@order/presenters/http/controllers/order.controller';
import { DomainExceptionFilter } from '@shared/filters/domain-exception.filter';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('DomainExceptionFilter (e2e mapping)', () => {
  let app: INestApplication;
  const orderService = {
    createOrder: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getOrder: jest.fn(),
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
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('maps a NOT_FOUND domain exception to 404 with the message', async () => {
    orderService.getOrder.mockRejectedValue(new OrderNotFoundException(UUID));

    await request(app.getHttpServer())
      .get(`/orders/${UUID}`)
      .expect(404)
      .expect({
        statusCode: 404,
        error: 'OrderNotFoundException',
        message: `Order not found: ${UUID}`,
      });
  });

  it('maps a CONFLICT (invalid state) domain exception to 409', async () => {
    orderService.confirmOrder.mockRejectedValue(
      new InvalidOrderStateException('Order must be in PENDING state'),
    );

    await request(app.getHttpServer())
      .post(`/orders/${UUID}/confirm`)
      .expect(409)
      .expect({
        statusCode: 409,
        error: 'InvalidOrderStateException',
        message: 'Order must be in PENDING state',
      });
  });

  it('maps a CONFLICT (not cancellable) domain exception to 409', async () => {
    orderService.cancelOrder.mockRejectedValue(
      new OrderNotCancellableException(),
    );

    await request(app.getHttpServer())
      .post(`/orders/${UUID}/cancel`)
      .expect(409);
  });

  it('does not hijack the ValidationPipe 400 for a bad body', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ customerId: '', items: [] })
      .expect(400);

    expect(orderService.createOrder).not.toHaveBeenCalled();
  });
});
