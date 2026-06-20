import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { OrderModule } from '@order/order.module';
import { OutboxModule } from '@outbox/outbox.module';
import { PaymentModule } from '@payment/payment.module';
import { ShipmentModule } from '@shipment/shipment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        // better-sqlite3 (synchronous) over the async `sqlite3` driver: it
        // serializes transactions, so the concurrent @Interval writers (relay +
        // schedulers) can't interleave BEGINs on SQLite's single connection.
        type: 'better-sqlite3',
        database: process.env.DB_PATH ?? 'order-management.sqlite',
        autoLoadEntities: true,
        synchronize: true,
        logging: process.env.DB_LOG === '1',
      }),
      // Register the DataSource with typeorm-transactional so @Transactional()
      // works. Return it un-initialized — Nest initializes it (see
      // TypeOrmCoreModule.createDataSourceFactory).
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    OutboxModule,
    OrderModule,
    PaymentModule,
    ShipmentModule,
  ],
})
export class AppModule {}
