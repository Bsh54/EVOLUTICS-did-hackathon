import { IssuanceController } from './issuance.controller';
import { Module } from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { CredoAgentModule } from 'src/credo-agent/credo-agent.module';
import { ShortUrlModule } from 'src/short-url/short-url.module';

@Module({
  imports: [CredoAgentModule, ShortUrlModule],
  providers: [IssuanceService],
  exports: [IssuanceService],

  controllers: [IssuanceController],
})
export class IssuanceModule {}
