import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as QRCode from 'qrcode';
import { SendInviteDto } from './dto/sendInviteEmail.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendInviteUrlEmail(input: SendInviteDto) {

    const oob = input.inviteLink;

    // ✅ deep link with optional type param
    // const deepLink =
    //   input.type && input.type.length > 0
    //     ? `polyid://invite?oob=${encodeURIComponent(oob)}&type=${encodeURIComponent(input.type)}`
    //     : `polyid://invite?oob=${encodeURIComponent(oob)}`;

    // ✅ qr code for deep link
    const qrCodeDataUrl = await QRCode.toDataURL(oob, {
      errorCorrectionLevel: 'M',
      width: 260,
      margin: 1,
    });

      const sent = await this.sendMail({
      to: input.email,
      subject: 'SSI Wallet Invite',
      template: 'ssi-invite',
      context: {
        name: input.name || 'User',
        inviteLink: oob,
        qrCode: qrCodeDataUrl,
        // optional (for display)
        invitePayload: oob,
        inviteType: input.type || 'generic',
      },
    });

    return {
      success: sent,
      inviteLink: oob,
      inviteType: input.type || 'generic',
      message: sent ? 'Invite email sent successfully' : 'Failed to send invite email',
    };
  }

  async sendMail(params: {
    to: string;
    subject: string;
    template: string;
    context?: Record<string, any>;
    from?: string;
  }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: params.to,
        subject: params.subject,
        template: params.template,
        context: params.context || {},
        ...(params.from ? { from: params.from } : {}),
      });

      return true;
    } catch (error: any) {
      this.logger.error(
        `Email failed to=${params.to} template=${params.template}`,
        error?.stack || error,
      );
      return false;
    }
  }
}
