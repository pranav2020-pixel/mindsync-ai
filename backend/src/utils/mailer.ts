import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: any = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Development fallback transporter or console mock
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporter;
};

export const sendEmail = async (options: SendEmailOptions): Promise<{ success: boolean; previewCode?: string }> => {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: process.env.SMTP_FROM || '"MindSync AI" <support@mindsync.ai>',
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      html: options.html,
    });

    console.log(`[MindSync Email] Sent to: ${options.to} | Subject: "${options.subject}"`);
    return { success: true };
  } catch (error) {
    console.error("[MindSync Email] Failed to send email via SMTP:", error);
    return { success: false };
  }
};

export const getPasswordResetEmailTemplate = (name: string, code: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
      .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; }
      .logo { font-size: 24px; font-weight: 700; color: #38bdf8; text-align: center; margin-bottom: 24px; }
      .code-box { background: #0f172a; border: 2px dashed #38bdf8; border-radius: 12px; padding: 20px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 24px 0; }
      p { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
      .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">🧠 MindSync AI</div>
      <h2>Password Reset Request</h2>
      <p>Hello ${name || "there"},</p>
      <p>We received a request to reset your password. Use the 6-digit verification code below to set a new password for your account:</p>
      <div class="code-box">${code}</div>
      <p>This verification code is valid for <strong>15 minutes</strong>. If you did not request this change, you can safely ignore this email — your account remains secure.</p>
      <div class="footer">
        &copy; ${new Date().getFullYear()} MindSync AI. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const getAccountDeletionEmailTemplate = (name: string, code: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
      .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #ef4444; padding: 32px; }
      .logo { font-size: 24px; font-weight: 700; color: #ef4444; text-align: center; margin-bottom: 24px; }
      .code-box { background: #0f172a; border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ef4444; margin: 24px 0; }
      p { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
      .warning { color: #fca5a5; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; font-size: 13px; }
      .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">⚠️ MindSync AI</div>
      <h2 style="color: #ef4444;">Confirm Account Deletion</h2>
      <p>Hello ${name || "there"},</p>
      <p>We received a request to permanently delete your MindSync AI account.</p>
      <div class="warning">
        <strong>Warning:</strong> This action will permanently erase all your personal data, journal entries, mood records, habit streaks, assessments, and AI insights. This cannot be undone.
      </div>
      <p>To confirm that it's you, enter this 6-digit confirmation code:</p>
      <div class="code-box">${code}</div>
      <p>This code expires in <strong>15 minutes</strong>. If you did not request account deletion, change your password immediately.</p>
      <div class="footer">
        &copy; ${new Date().getFullYear()} MindSync AI. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
