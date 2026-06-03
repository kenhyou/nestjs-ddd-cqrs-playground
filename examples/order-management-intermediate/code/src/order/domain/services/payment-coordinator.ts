import { Injectable } from '@nestjs/common';
import { Order } from '@order/domain/models/order.model';

@Injectable()
export class PaymentCoordinator {
  canShip(order: Order, isPaid: boolean): boolean {
    return order.isConfirmed() && isPaid;
  }
}
