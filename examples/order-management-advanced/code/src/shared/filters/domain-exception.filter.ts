import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  DomainExceptionCategory,
} from '@shared/exceptions/domain-exception';

const STATUS_BY_CATEGORY: Record<DomainExceptionCategory, HttpStatus> = {
  [DomainExceptionCategory.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainExceptionCategory.CONFLICT]: HttpStatus.CONFLICT,
};

// Maps domain rule violations to HTTP status codes (404 / 409). Only catches
// DomainException, so framework errors (e.g. ValidationPipe's 400) pass through.
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      STATUS_BY_CATEGORY[exception.category] ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
