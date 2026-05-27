import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '@order/infra/entities/order.entity';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderModule } from '@order/order.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'order.db',
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true,
    }),
    OrderModule,
  ],
})
export class AppModule {}
