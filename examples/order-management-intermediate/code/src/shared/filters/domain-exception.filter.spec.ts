import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from '@shared/filters/domain-exception.filter';
import {
  DomainErrorCategory,
  DomainException,
} from '@shared/exceptions/domain.exception';
import { OrderNotFoundException } from '@order/domain/exceptions/order-not-found.exception';
import { InvalidOrderStateException } from '@order/domain/exceptions/invalid-order-state.exception';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment-not-found.exception';
import { InvalidPaymentStateException } from '@payment/domain/exceptions/invalid-payment-state.exception';

// A minimal DomainException to exercise each category in isolation.
class FakeDomainException extends DomainException {
  constructor(
    readonly category: DomainErrorCategory,
    message: string,
  ) {
    super(message);
  }
}

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const getResponse = jest.fn().mockReturnValue({ status });
  const host = {
    switchToHttp: () => ({ getResponse }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  it('maps NOT_FOUND → 404 with category + message body', () => {
    const { host, status, json } = mockHost();

    filter.catch(new FakeDomainException('NOT_FOUND', 'gone'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'gone',
    });
  });

  it('maps CONFLICT → 409 with category + message body', () => {
    const { host, status, json } = mockHost();

    filter.catch(new FakeDomainException('CONFLICT', 'bad state'), host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'CONFLICT',
      message: 'bad state',
    });
  });

  // The concrete exceptions must declare the categories the filter relies on.
  describe('concrete exception categories', () => {
    it('OrderNotFoundException / PaymentNotFoundException are NOT_FOUND', () => {
      expect(new OrderNotFoundException('o1').category).toBe('NOT_FOUND');
      expect(new PaymentNotFoundException('p1').category).toBe('NOT_FOUND');
    });

    it('InvalidOrderStateException / InvalidPaymentStateException are CONFLICT', () => {
      expect(new InvalidOrderStateException('x').category).toBe('CONFLICT');
      expect(new InvalidPaymentStateException('x').category).toBe('CONFLICT');
    });

    it('routes a real OrderNotFoundException to 404', () => {
      const { host, status } = mockHost();
      filter.catch(new OrderNotFoundException('o1'), host);
      expect(status).toHaveBeenCalledWith(404);
    });

    it('routes a real InvalidPaymentStateException to 409', () => {
      const { host, status } = mockHost();
      filter.catch(new InvalidPaymentStateException('nope'), host);
      expect(status).toHaveBeenCalledWith(409);
    });
  });
});
