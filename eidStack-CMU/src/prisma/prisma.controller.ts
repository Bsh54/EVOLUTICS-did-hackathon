import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';


@ApiTags('prisma')
@Controller('prisma')
export class PrismaController {
  constructor(private readonly prismaService: PrismaService) {}

}
