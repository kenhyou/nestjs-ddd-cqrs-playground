export type DomainErrorCategory = 'NOT_FOUND' | 'CONFLICT';

export abstract class DomainException extends Error {
  abstract readonly category: DomainErrorCategory;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name; // so stack/logs show the concrete class name
  }
}
