import { ApiProperty } from '@nestjs/swagger';

export class CreateConnectionInvitationDto {
  @ApiProperty()
  orgDid: any;
}
