import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ?? 'An error occurred';

    const error =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { error?: string }).error ?? 'Error';

    response.status(status).json({
      error: typeof error === 'string' ? error : 'Error',
      message: Array.isArray(message) ? message.join(', ') : String(message),
      statusCode: status,
    });
  }
}
