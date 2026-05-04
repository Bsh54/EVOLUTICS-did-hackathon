import { VerificationController } from './verification.controller';
import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CredoAgentModule } from 'src/credo-agent/credo-agent.module';
import { ShortUrlModule } from 'src/short-url/short-url.module';

@Module({
  imports: [CredoAgentModule, ShortUrlModule],
  providers: [VerificationService],
  exports: [VerificationService],

  controllers: [VerificationController],
})
export class VerificationModule {}
