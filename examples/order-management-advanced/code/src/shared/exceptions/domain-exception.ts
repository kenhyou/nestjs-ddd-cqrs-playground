export enum DomainExceptionCategory {
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
}

// Framework-free base for business-rule violations. The HTTP layer maps the
// category to a status code (see DomainExceptionFilter); the domain stays pure.
export abstract class DomainException extends Error {
  abstract readonly category: DomainExceptionCategory;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
