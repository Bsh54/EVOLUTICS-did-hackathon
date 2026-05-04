// src/short-url/short-url.service.ts
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class ShortUrlService {
  private baseUrl = process.env.API_BASE_URL || 'http://localhost:4000'; // replace with your domain

  constructor(private readonly prisma: PrismaService) {}

  // Generate short URL and save in DB
  async generateShortUrl(originalUrl: string): Promise<string> {
    const code = randomBytes(4).toString('hex'); 

    await this.prisma.shortUrl.create({
      data: { code, originalUrl },
    });

    const shortUrl = `${this.baseUrl}/short-url/s/${code}`;
    return shortUrl;
  }

  // Fetch original URL from DB using code
  async getOriginalUrl(code: string): Promise<string | null> {
    const record = await this.prisma.shortUrl.findUnique({ where: { code } });
    return record ? record.originalUrl : null;
  }
}
