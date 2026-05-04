import { CredoAgentController } from './credo-agent.controller';
// src/credo-agent/credo-agent.module.ts
import { Module } from '@nestjs/common';
import { CredoAgentService } from './credo-agent.service';
import { CredoEventsService } from './credo-events.service';

@Module({
  providers: [CredoAgentService, CredoEventsService],
  exports: [CredoAgentService],

  controllers: [CredoAgentController],
})
export class CredoAgentModule {}
