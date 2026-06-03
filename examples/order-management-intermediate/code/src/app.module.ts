import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { OrderModule } from '@order/order.module';
import { PaymentModule } from '@payment/payment.module';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { PaymentEntity } from '@payment/infra/entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: 'order-management.sqlite',
        entities: [OrderEntity, OrderItemEntity, PaymentEntity],
        synchronize: true,
        logging: 'all',
      }),
      dataSourceFactory: async (options) => {
        if (!options) throw new Error('Invalid DataSource options');
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    OrderModule,
    PaymentModule,
  ],
})
export class AppModule {}
