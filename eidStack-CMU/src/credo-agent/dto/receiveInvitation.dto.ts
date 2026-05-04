import { ApiProperty } from '@nestjs/swagger';

export class ReceiveInvitationDto {
  @ApiProperty({ description: 'Out-of-band invitation URL' })
  invitationUrl: string;
}
