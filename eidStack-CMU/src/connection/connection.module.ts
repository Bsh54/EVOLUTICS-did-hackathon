import { ConnectionController } from './connection.controller';
import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CredoAgentModule } from 'src/credo-agent/credo-agent.module';
import { ShortUrlModule } from 'src/short-url/short-url.module';
@Module({
  imports: [PrismaModule, CredoAgentModule,ShortUrlModule],
  providers: [ConnectionService],

  controllers: [ConnectionController],
})
export class ConnectionModule {}
