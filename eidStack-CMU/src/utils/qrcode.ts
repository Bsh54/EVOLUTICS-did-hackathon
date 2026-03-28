// src/utils/qrcode.ts
import * as QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data);
}
