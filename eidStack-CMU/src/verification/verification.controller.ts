// src/verification/verification.controller.ts
import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { ProofRequestDto, GetProofStatusDto } from './dto/verification.dto';
import { handleController } from '../common/utils/handle.controller';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * GET /verification/proofStatus?proofRecordId=...
   * Keeps the original endpoint URL
   */
  @ApiOperation({ summary: 'Get proof/request status' })
  @ApiResponse({ status: 200, description: 'Proof state (string)' })
  @ApiBadRequestResponse({ description: 'Invalid proofRecordId' })
  @Get('proofStatus')
  async getProofStatus(@Query('proofRecordId') proofRecordId: string) {
    return handleController(async () => {
      if (!proofRecordId) {
        // Throwing here ensures handleController will normalize to a BadRequest-like response
        throw new Error('proofRecordId is required');
      }
      const state = await this.verificationService.getProofStatus(proofRecordId);
      return state;
    });
  }

  /**
   * POST /verification/createProofRequest
   * Keeps the original endpoint URL and accepts the same shape as GraphQL input (now validated by DTO)
   */
  @ApiOperation({ summary: 'Create proof request (OOB or connection-based)' })
  @ApiResponse({ status: 201, description: 'Proof request created (object)' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @HttpCode(HttpStatus.CREATED)
  @Post('createProofRequest')
  async createProofRequest(@Body() body: ProofRequestDto) {
    return handleController(async () => {
      // Pass DTO directly to service; DTO maps to service expected shape
      const result = await this.verificationService.createProofRequest(body as any);
      return result; 
    });
  }
}
