import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  correlationId: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: ['field must be a UUID', 'name should not be empty'] })
  message: any;
}