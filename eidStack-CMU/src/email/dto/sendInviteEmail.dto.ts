import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";

export class SendInviteDto {
  @ApiProperty({ example: 'vkumar@idssoft.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'http://localhost:4000/register?email=vkumar%40idssoft.com' })
  @IsString()
  @IsNotEmpty()
  inviteLink: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    example: 'offer',
    enum: ['connection', 'offer', 'proof', 'zkp-proof'],
  })
  @IsOptional()
  @IsIn(['connection', 'offer', 'proof', 'zkp-proof'])
  type?: 'connection' | 'offer' | 'proof' | 'zkp-proof';
}