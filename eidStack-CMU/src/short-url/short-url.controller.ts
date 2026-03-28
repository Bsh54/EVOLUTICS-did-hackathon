import { Controller, Post, Get, Body, Query, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShortUrlService } from './short-url.service';
import { CreateShortUrlDto } from './dto/createShortUrl.dto';
import { Response } from 'express';

@ApiTags('short-url')
@Controller('short-url')
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) {}

  // create short url
  @Post('create')
  @ApiOperation({ summary: 'Create short URL' })
  async createShortUrl(@Body() body: CreateShortUrlDto) {
    return this.shortUrlService.generateShortUrl(body.originalUrl);
  }

  // retrieve original url by code
  @Get('resolve')
  @ApiOperation({ summary: 'Resolve code to original URL' })
  async getOriginalUrl(@Query('code') code: string) {
    return this.shortUrlService.getOriginalUrl(code);
  }

    // -------------------------------
  // Redirect (public short link)
  // GET /s/:code
  // -------------------------------
  @Get('s/:code')
  async redirectToOriginal(
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    const originalUrl = await this.shortUrlService.getOriginalUrl(code);

    if (!originalUrl) {
      return res.status(404).send('Short URL not found');
    }

    return res.redirect(302, encodeURI(originalUrl));
  }
}
