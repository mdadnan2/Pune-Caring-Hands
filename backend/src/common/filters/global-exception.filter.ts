import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const multerCode = getMulterErrorCode(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : multerCode === 'LIMIT_FILE_SIZE'
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : multerCode
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      multerCode === 'LIMIT_FILE_SIZE'
        ? 'File size must not exceed 5MB'
        : multerCode
          ? 'Invalid file upload'
          : exception instanceof HttpException
            ? ((exception.getResponse() as { message?: string | string[] }).message ??
              exception.message)
            : 'Internal server error';

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message.join('; ') : message,
      code: multerCode
        ? 'VALIDATION_ERROR'
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'INTERNAL_ERROR'
          : 'REQUEST_ERROR',
    });
  }
}

function getMulterErrorCode(exception: unknown): string | undefined {
  if (
    typeof exception === 'object' &&
    exception !== null &&
    'code' in exception &&
    typeof exception.code === 'string' &&
    exception.code.startsWith('LIMIT_')
  ) {
    return exception.code;
  }
  return undefined;
}
