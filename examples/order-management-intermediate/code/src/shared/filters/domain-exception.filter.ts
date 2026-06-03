import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  DomainErrorCategory,
  DomainException,
} from '@shared/exceptions/domain.exception';

const CATEGORY_STATUS: Record<DomainErrorCategory, number> = {
  NOT_FOUND: 404,
  CONFLICT: 409,
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = CATEGORY_STATUS[exception.category];

    response.status(statusCode).json({
      statusCode,
      error: exception.category,
      message: exception.message,
    });
  }
}
