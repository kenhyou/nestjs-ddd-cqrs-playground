import { PaymentCommandAdapter } from '@order/infra/adapters/payment-command.adapter';
import { PaymentMethod } from '@payment/domain/enums/payment-method.enum';
import { PaymentStatus } from '@payment/domain/enums/payment-status.enum';
import { Payment } from '@payment/domain/models/payment.model';

describe('PaymentCommandAdapter', () => {
  let paymentRepository: { save: jest.Mock; findById: jest.Mock };
  let adapter: PaymentCommandAdapter;

  beforeEach(() => {
    paymentRepository = { save: jest.fn(), findById: jest.fn() };
    adapter = new PaymentCommandAdapter(paymentRepository);
  });

  it('creates a REQUESTED payment for the order and saves it', async () => {
    await adapter.createPayment('o1', 1000, 'KRW', 'CARD'); // ← await (async)

    expect(paymentRepository.save).toHaveBeenCalledTimes(1);

    const saved: Payment = paymentRepository.save.mock.calls[0][0]; // the Payment passed to save
    expect(saved).toBeInstanceOf(Payment);
    expect(saved.getOrderId()).toBe('o1');
    expect(saved.getAmount().getAmount()).toBe(1000);
    expect(saved.getAmount().getCurrency()).toBe('KRW');
    expect(saved.getMethod()).toBe(PaymentMethod.CARD);
    expect(saved.getPaymentStatus()).toBe(PaymentStatus.REQUESTED);
  });
});
