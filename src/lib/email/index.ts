import { logger } from '@/lib/observability/logger';

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  replyTo?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<{ id: string; provider: string }> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    logger.warn({ to: args.to, subject: args.subject }, 'EMAIL_FROM not configured');
    return { id: 'noop', provider: 'noop' };
  }
  if (process.env.SMTP_URL) {
    const nodemailer = require('nodemailer');
    const tx = nodemailer.createTransport(process.env.SMTP_URL);
    const info = await tx.sendMail({
      from, to: args.to, subject: args.subject,
      html: args.html, text: args.text,
      attachments: args.attachments,
      replyTo: args.replyTo,
    });
    return { id: info.messageId, provider: 'smtp' };
  }
  if (process.env.AWS_REGION) {
    const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
    const ses = new SESv2Client({ region: process.env.AWS_REGION });
    const out = await ses.send(new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: Array.isArray(args.to) ? args.to : [args.to] },
      Content: { Simple: { Subject: { Data: args.subject, Charset: 'UTF-8' }, Body: { Html: { Data: args.html, Charset: 'UTF-8' } } } },
    }));
    return { id: out.MessageId, provider: 'ses' };
  }
  logger.info({ to: args.to, subject: args.subject }, 'email (dev): no provider configured');
  return { id: 'dev', provider: 'noop' };
}
