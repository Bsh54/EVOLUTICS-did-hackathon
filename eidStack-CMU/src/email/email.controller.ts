import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SendInviteDto } from './dto/sendInviteEmail.dto';
import { EmailService } from './email.service';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-invite-url')
  @ApiOperation({ summary: 'Send invite URL email' })
  @ApiBody({ type: SendInviteDto })
  async sendInviteUrl(@Body() body: SendInviteDto) {
    return this.emailService.sendInviteUrlEmail(body);
  }
}
