import { Module } from '@nestjs/common';
import { CredoAgentModule } from './credo-agent/credo-agent.module';
import { ConnectionModule } from './connection/connection.module';
import { PrismaModule } from './prisma/prisma.module';
import { IssuanceModule } from './issuance/issuance.module';
import { VerificationModule } from './verification/verification.module';
import { ShortUrlModule } from './short-url/short-url.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    CredoAgentModule,
    ConnectionModule,
    IssuanceModule,
    VerificationModule,
    ShortUrlModule,
    PrismaModule,
    CleanupModule,
    //EmailModule // optional for now, but can be used for email notifications in the future
  ],
})
export class AppModule { }
