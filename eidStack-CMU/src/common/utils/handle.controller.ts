import { HttpException, InternalServerErrorException, ConflictException, BadRequestException, BadGatewayException } from '@nestjs/common';

function isDuplicateKeyError(err: any) {
  return err && (err.code === 11000 || err.code === '23505' || (err.message && /duplicate key/i.test(err.message)));
}

function extractDuplicateDetails(err: any) {
  return { message: err.message };
}

function isValidationError(err: any) {
  return err && (err.name === 'ValidationError' || Array.isArray(err?.errors));
}

function isExternalServiceError(err: any) {
  return err && (err.isAxiosError || /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/.test(err.message || ''));
}

export async function handleController(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpException) throw err;
    if (isDuplicateKeyError(err)) {
      throw new ConflictException({
        message: 'Resource conflict',
        code: 'DB_DUPLICATE_KEY',
        details: extractDuplicateDetails(err),
      });
    }
    if (isValidationError(err)) {
      throw new BadRequestException({ message: 'Validation failed', details: err, code: 'VALIDATION_ERROR' });
    }
    if (isExternalServiceError(err)) {
      throw new BadGatewayException({ message: 'External service failed', code: 'EXTERNAL_SERVICE_ERROR', details: err.message });
    }
    throw new InternalServerErrorException({ message: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
}
