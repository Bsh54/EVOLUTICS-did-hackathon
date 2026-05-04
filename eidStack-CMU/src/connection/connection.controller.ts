import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConnectionService } from './connection.service';

@ApiTags('connection')
@Controller('connection')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  // Service method: async createConnectionInvitation() { ... }  (no args)
  @Post('createInvitation')
  @ApiOperation({ summary: 'Create Out-of-Band connection invitation' })
  async createConnectionInvitation() {
    return this.connectionService.createConnectionInvitation();
  }
}
