import { OrderStatus } from '@order/domain/enums/order-status.enum';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Order } from '@order/domain/models/order.model';
import { Money } from '@order/domain/vo/money.vo';
import { OrderId } from '@order/domain/vo/order-id.vo';
import { OrderItemId } from '@order/domain/vo/order-item-id.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';
import { OrderItemEntity } from '@order/infra/entities/order-item.entity';
import { OrderEntity } from '@order/infra/entities/order.entity';

export class OrderMapper {
  static toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.getOrderId().getValue();
    entity.customerId = order.getCustomerId();
    entity.status = order.getOrderStatus();
    entity.totalPriceAmount = order.getTotalPrice().getAmount();
    entity.totalPriceCurrency = order.getTotalPrice().getCurrency();
    entity.paymentStatus = order.getPaymentStatus();
    entity.shipmentStatus = order.getShipmentStatus();
    entity.items = order.getOrderItems().map((item) => this.toItemEntity(item));
    return entity;
  }

  static toDomain(entity: OrderEntity): Order {
    return Order.reconstitute(
      OrderId.create(entity.id),
      entity.customerId,
      entity.status as OrderStatus,
      Money.create(entity.totalPriceAmount, entity.totalPriceCurrency),
      (entity.items ?? []).map((item) => this.toItemDomain(item)),
      entity.paymentStatus,
      entity.shipmentStatus,
    );
  }

  private static toItemEntity(item: OrderItem): OrderItemEntity {
    const entity = new OrderItemEntity();
    entity.id = item.getOrderItemId().getValue();
    entity.productId = item.getProductId();
    entity.productName = item.getProductName();
    entity.unitPriceAmount = item.getUnitPrice().getAmount();
    entity.unitPriceCurrency = item.getUnitPrice().getCurrency();
    entity.quantity = item.getQuantity().getValue();
    return entity;
  }

  private static toItemDomain(entity: OrderItemEntity): OrderItem {
    return OrderItem.reconstitute(
      OrderItemId.create(entity.id),
      entity.productId,
      entity.productName,
      Money.create(entity.unitPriceAmount, entity.unitPriceCurrency),
      Quantity.create(entity.quantity),
    );
  }
}
