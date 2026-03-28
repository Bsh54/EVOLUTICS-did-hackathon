import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
 
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
 
  constructor(private readonly prisma: PrismaService) {}
 
  // Runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteIncompleteConnections() {
    this.logger.log('🧹 Running cleanup for incomplete connections...');
 
    const result = await this.prisma.connection.deleteMany({
      where: {
        status: {
          not: 'completed',
        },
      },
    });
 
    this.logger.log(`Deleted ${result.count} incomplete connections.`);
  }
}