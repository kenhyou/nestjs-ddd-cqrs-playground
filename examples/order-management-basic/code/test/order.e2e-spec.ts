import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { OrderModule } from '@order/order.module';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';

describe('Order E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:', // ← in-memory DB
          entities: [OrderEntity, OrderItemEntity],
          synchronize: true,
        }),
        OrderModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('happy path: create → addItem → confirm → ship', async () => {
    // 1. POST /orders → orderId 받기
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: 'c1',
        items: [{ name: 'A', quantity: 1, unitPrice: 100, currency: 'KRW' }],
      })
      .expect(201);
    const orderId = res.body.orderId;

    // 2. POST /orders/:id/items → 아이템 추가
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/items`)
      .send({
        name: 'B',
        quantity: 2,
        unitPrice: 200,
        currency: 'KRW',
      })
      .expect(201);
    // 3. POST /orders/:id/confirm
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/confirm`)
      .expect(201);
    // 4. POST /orders/:id/ship
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/ship`)
      .expect(201);
    // 5. GET /orders/:id → 상태가 SHIPPED인지 검증
    const getRes = await request(app.getHttpServer())
      .get(`/orders/${orderId}`)
      .expect(200);

    expect(getRes.body.orderId).toBe(orderId);
    expect(getRes.body.status).toBe('SHIPPED');
  });

  it('invariant violation: SHIPPED 상태에서 cancel → 에러', async () => {
    // 1~4 까지 진행
    // 1. POST /orders → orderId 받기
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: 'c2',
        items: [{ name: 'X', quantity: 1, unitPrice: 500, currency: 'KRW' }],
      })
      .expect(201);
    const orderId = res.body.orderId;

    // 2. POST /orders/:id/items → 아이템 추가
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/items`)
      .send({
        name: 'Y',
        quantity: 3,
        unitPrice: 100,
        currency: 'KRW',
      })
      .expect(201);

    // 3. POST /orders/:id/confirm
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/confirm`)
      .expect(201);

    // 4. POST /orders/:id/ship
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/ship`)
      .expect(201);

    // 5. POST /orders/:id/cancel → 400/500 에러
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/cancel`)
      .expect(500);
  });
});
