// src/credo-agent/dto/initAgent.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class InitAgentDto {
  @ApiProperty()
  @IsString()
  walletId: string;

  @ApiProperty()
  @IsString()
  walletKey: string;

  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiProperty()
  @IsString()
  label: string;

  // MAKE THIS REQUIRED to match service signature
  @ApiProperty()
  @IsString()
  seed: string;
}
