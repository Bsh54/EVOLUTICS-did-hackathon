import { ApiProperty } from '@nestjs/swagger';

export class CreateShortUrlDto {
  @ApiProperty()
  originalUrl: string;
}
