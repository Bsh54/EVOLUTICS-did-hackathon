import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CredentialAttributeInput } from './issuance-dto';

export class OfferCredentialWithUrlDto {
  @ApiProperty()
  @IsString()
  credentialDefinitionId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  connectionId?: string;

  @ApiProperty({ type: [CredentialAttributeInput], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialAttributeInput)
  attributes?: CredentialAttributeInput[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
