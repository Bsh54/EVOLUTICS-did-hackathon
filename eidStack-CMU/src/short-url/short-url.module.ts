import { Module } from '@nestjs/common';
import { ShortUrlService } from './short-url.service';
import { ShortUrlController } from './short-url.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ShortUrlService],
  controllers: [ShortUrlController],
  exports: [ShortUrlService],
})
export class ShortUrlModule {}
