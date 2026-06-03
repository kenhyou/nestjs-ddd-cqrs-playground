import { Order } from '@order/domain/models/order.model';
import { PaymentCoordinator } from './payment-coordinator';
import { OrderItem } from '@order/domain/models/order-item.model';
import { Money } from '@order/domain/vo/money.vo';
import { Quantity } from '@order/domain/vo/quantity.vo';

const buildItem = (unitPrice: number, quantity: number) =>
  OrderItem.create(
    'product-id',
    'product',
    Money.create(unitPrice, 'KRW'),
    Quantity.create(quantity),
  );

it('allows ship only when confirmed and paid', () => {
  const confirmed = (() => {
    const o = Order.create('c1', [buildItem(1000, 1)]);
    o.confirm();
    return o;
  })();
  const coord = new PaymentCoordinator();
  expect(coord.canShip(confirmed, true)).toBe(true);
  expect(coord.canShip(confirmed, false)).toBe(false);
  const pending = Order.create('c1', [buildItem(1000, 1)]);
  expect(coord.canShip(pending, true)).toBe(false);
});
