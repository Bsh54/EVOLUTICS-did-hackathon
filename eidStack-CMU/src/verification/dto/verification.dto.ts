// src/verification/dto/verification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
} from 'class-validator';

export class RestrictionDto {
  @ApiPropertyOptional({ description: 'Schema filter / predicate' })
  @IsOptional()
  schema?: any;

  @ApiPropertyOptional({ description: 'Credential definition id filter' })
  @IsOptional()
  credDefId?: any;
}

export class AttributeRequestDto {
  @ApiProperty({ description: 'Attribute name to request (e.g. email, given_name)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional array of restrictions (schema, credDefId)',
    type: [RestrictionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestrictionDto)
  restrictions?: RestrictionDto[];
}

export class PredicateRequestDto {
  @ApiProperty({ description: 'Predicate attribute name' })
  @IsString()
  name: string;

  @ApiProperty({ description: "pType (e.g. '>=', '<=', '>')" })
  @IsString()
  pType: string;

  @ApiProperty({ description: 'predicate value' })
  @IsInt()
  pValue: number;
}

export class ProofRequestDto {
  @ApiProperty({ description: 'Credential definition id used for this proof request' })
  @IsString()
  credDefId: string;

  @ApiProperty({ type: [AttributeRequestDto], description: 'Attributes to request' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeRequestDto)
  attributes: AttributeRequestDto[];

  @ApiPropertyOptional({ type: [PredicateRequestDto], description: 'Optional predicates' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PredicateRequestDto)
  predicates?: PredicateRequestDto[];

  @ApiPropertyOptional({ description: 'Optional comment to include in proof request' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Optional connectionId if request should be connection-based' })
  @IsOptional()
  @IsString()
  connectionId?: string;
}

/**
 * Optional: a DTO only for query param validation if you want it
 */
export class GetProofStatusDto {
  @ApiProperty({ description: 'Proof record id' })
  @IsString()
  proofRecordId: string;
}
