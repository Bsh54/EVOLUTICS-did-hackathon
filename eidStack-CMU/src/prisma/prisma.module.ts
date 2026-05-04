import { PrismaController } from './prisma.controller';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],

  controllers: [PrismaController],
})
export class PrismaModule {}
