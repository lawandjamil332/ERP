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
  // Resend — simplest provider to start ($0). Set RESEND_API_KEY + EMAIL_FROM.
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.replyTo,
        attachments: args.attachments?.map((a) => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
        })),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error({ status: res.status, text: text.slice(0, 300) }, 'resend send failed');
      throw new Error(`resend_failed_${res.status}`);
    }
    const body = await res.json().catch(() => ({ id: 'resend' }));
    return { id: body.id ?? 'resend', provider: 'resend' };
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
