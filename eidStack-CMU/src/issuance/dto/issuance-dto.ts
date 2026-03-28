import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// ------------------ ATTRIBUTE INPUT ---------------------
export class AttributeInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  attributeName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  schemaDataType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName: string;
}

// ------------------ CREDENTIAL ATTRIBUTE INPUT ---------------------
// This is the class that was missing and caused the TS error.
// It's used by OfferCredentialWithUrlDto and exported for reuse.
export class CredentialAttributeInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;
}

// ------------------ CREATE SCHEMA INPUT -------------------
export class CreateSchemaInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ type: [AttributeInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeInput)
  attributes: AttributeInput[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  issuerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orgId?: string;
}

// ------------------ CREATE CRED-DEF INPUT -------------------
export class CreateCredDefInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  schemaId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tag: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  supportRevocation?: boolean;
}

// ------------------ PAGINATION -------------------
export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
