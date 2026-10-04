interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let primaryTransporter: any = null;
let fallbackTransporter: any = null;

export const getPrimaryTransporter = () => {
  if (primaryTransporter) return primaryTransporter;

  try {
    const nodemailer = require("nodemailer");
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim().replace(/\s+/g, "") : "";

    if (user && pass) {
      // Primary: High-speed pooled transport on Port 587 with STARTTLS (never port 465 which is blocked on cloud networks)
      primaryTransporter = nodemailer.createTransport({
        host,
        port: port === 465 ? 587 : port, // Force 587 if port 465 was provided in env
        secure: false, // Port 587 uses STARTTLS
        requireTLS: true,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  } catch (err) {
    console.warn("[MindSync Email] Primary transporter init failed:", err);
    primaryTransporter = null;
  }

  return primaryTransporter;
};

export const getFallbackTransporter = () => {
  if (fallbackTransporter) return fallbackTransporter;

  try {
    const nodemailer = require("nodemailer");
    const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim().replace(/\s+/g, "") : "";

    if (user && pass) {
      // Fallback: Direct non-pooled smtp.gmail.com on port 587 with STARTTLS
      fallbackTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  } catch (err) {
    fallbackTransporter = null;
  }

  return fallbackTransporter;
};

export const verifyMailTransporter = async (): Promise<{ success: boolean; error?: string }> => {
  const transporter = getPrimaryTransporter();
  if (!transporter) return { success: false, error: "No transporter configured (missing SMTP_USER or SMTP_PASS)" };
  try {
    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
};

export const cleanHtmlToPlainText = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&copy;/g, "©")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const sendEmail = async (options: SendEmailOptions): Promise<{ success: boolean; previewCode?: string }> => {
  const plainText = options.text || cleanHtmlToPlainText(options.html);
  const replyTo = process.env.REPLY_TO || process.env.SMTP_USER || "support@mindsync.ai";
  const toEmail = options.to.trim().toLowerCase();

  // Smart Resend check:
  // With free unverified onboarding@resend.dev, Resend REJECTS all emails not sent to the account owner (pranavmsc2020@gmail.com).
  // We ONLY call Resend if we have a verified custom domain OR the recipient is the owner.
  const isDefaultResendDomain = !process.env.RESEND_FROM || process.env.RESEND_FROM.includes("resend.dev");
  const isOwnerRecipient = toEmail === (process.env.SMTP_USER || "pranavmsc2020@gmail.com").toLowerCase();
  const canUseResend = Boolean(process.env.RESEND_API_KEY) && (!isDefaultResendDomain || isOwnerRecipient);

  if (canUseResend) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "MindSync AI <onboarding@resend.dev>",
          to: [options.to],
          reply_to: replyTo,
          subject: options.subject,
          html: options.html,
          text: plainText,
          headers: {
            "X-Entity-Ref-ID": `${Date.now()}`,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json() as any;
        console.log(`[MindSync Email - Resend API] Sent to: ${options.to} (ID: ${data.id})`);
        return { success: true };
      } else {
        const errText = await res.text();
        console.warn(`[MindSync Email - Resend API] Non-critical fallback triggered:`, errText);
      }
    } catch (resendErr) {
      console.warn(`[MindSync Email - Resend API] Error:`, resendErr);
    }
  }

  // Method 2: High-Performance Gmail SMTP (Nodemailer Pool)
  const fromAddress = process.env.SMTP_FROM || (process.env.SMTP_USER ? `"MindSync AI" <${process.env.SMTP_USER}>` : '"MindSync AI" <support@mindsync.ai>');

  const transport = getPrimaryTransporter();
  if (transport) {
    try {
      await transport.sendMail({
        from: fromAddress,
        to: options.to,
        replyTo,
        subject: options.subject,
        text: plainText,
        html: options.html,
      });

      console.log(`[MindSync Email - Gmail SMTP] Successfully delivered to: ${options.to}`);
      return { success: true };
    } catch (primaryErr) {
      console.warn("[MindSync Email - Gmail SMTP] Primary send failed, attempting fallback port 587...", primaryErr);
    }
  }

  // Method 3: Fallback Port 587 STARTTLS
  const fallback = getFallbackTransporter();
  if (fallback) {
    try {
      await fallback.sendMail({
        from: fromAddress,
        to: options.to,
        replyTo,
        subject: options.subject,
        text: plainText,
        html: options.html,
      });

      console.log(`[MindSync Email - Fallback SMTP 587] Successfully delivered to: ${options.to}`);
      return { success: true };
    } catch (fallbackErr) {
      console.error("[MindSync Email] All SMTP delivery transports failed:", fallbackErr);
    }
  }

  return { success: false };
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

export const getEmailOtpTemplate = (code: string, purpose: string = "Sign In"): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
      .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
      .logo { font-size: 26px; font-weight: 800; color: #38bdf8; text-align: center; margin-bottom: 24px; letter-spacing: -0.5px; }
      .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
      .code-box { background: #090d16; border: 2px dashed #0284c7; border-radius: 14px; padding: 24px; text-align: center; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; margin: 24px 0; font-family: 'Courier New', Courier, monospace; }
      p { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
      .note { background: rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 10px; font-size: 13px; color: #94a3b8; border-left: 3px solid #38bdf8; margin-top: 20px; }
      .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">🧠 MindSync AI</div>
      <div style="text-align: center;">
        <span class="badge">Verification Code</span>
      </div>
      <h2 style="text-align: center; margin-top: 4px; font-size: 20px; color: #f8fafc;">Your ${purpose} Code</h2>
      <p>Hello,</p>
      <p>Use the 6-digit One-Time Password (OTP) below to authenticate your MindSync AI account:</p>
      <div class="code-box">${code}</div>
      <p>This verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
      <div class="note">
        If you did not request this verification code, please ignore this email. Your account remains secure.
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} MindSync AI. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const getEmailOtpText = (code: string, purpose: string = "Sign In"): string => {
  return `MindSync AI - ${purpose}\n\nYour 6-digit verification code is: ${code}\n\nThis verification code is valid for 10 minutes. Do not share this code with anyone.\n\nIf you did not request this verification code, please ignore this email. Your account remains secure.\n\n© ${new Date().getFullYear()} MindSync AI. All rights reserved.`;
};

export const getPasswordResetEmailText = (name: string, code: string): string => {
  return `Hello ${name || "there"},\n\nWe received a request to reset your MindSync AI account password.\n\nYour 6-digit verification code is: ${code}\n\nThis verification code is valid for 15 minutes. If you did not request this change, you can safely ignore this email — your account remains secure.\n\n© ${new Date().getFullYear()} MindSync AI. All rights reserved.`;
};

export const getAccountDeletionEmailText = (name: string, code: string): string => {
  return `Hello ${name || "there"},\n\nWe received a request to permanently delete your MindSync AI account.\n\nYour 6-digit confirmation code is: ${code}\n\nThis code expires in 15 minutes. If you did not request account deletion, change your password immediately.\n\n© ${new Date().getFullYear()} MindSync AI. All rights reserved.`;
};
