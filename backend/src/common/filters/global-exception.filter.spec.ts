import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  it('preserves machine-readable codes provided by business exceptions', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    };
    const filter = new GlobalExceptionFilter();

    filter.catch(
      new ConflictException({
        message: 'A slot already exists for this date and start time.',
        code: 'SLOT_DUPLICATE',
      }),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'A slot already exists for this date and start time.',
      code: 'SLOT_DUPLICATE',
    });
  });

  it('keeps the standard request error code when no business code is provided', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    };

    new GlobalExceptionFilter().catch(new HttpException('Bad request', 400), host as never);

    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad request',
      code: 'REQUEST_ERROR',
    });
  });
});
