const nodemailer = require('nodemailer');

/**
 * Email Service Utility
 * 
 * Supports:
 * 1. Production / Real SMTP (Gmail App Password, SendGrid, etc.) via .env:
 *    - EMAIL_SERVICE (default: 'gmail')
 *    - EMAIL_USER
 *    - EMAIL_PASS
 * 
 * 2. Development Fallback: Ethereal virtual SMTP simulator or direct local link
 */

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  // 1. Real email credentials from .env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log(`\n[Email Service]: Real email transport active (${process.env.EMAIL_USER})`);
      return transporter;
    } catch (err) {
      console.error('[Email Service]: Failed to initialize custom SMTP:', err.message);
    }
  }

  // 2. Development fallback with Ethereal
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('\n[Email Service]: Using Ethereal development test account');
    return transporter;
  } catch (err) {
    console.warn('[Email Service]: Could not connect to Ethereal SMTP, using direct local link mode:', err.message);
    return null;
  }
};

/**
 * Send an email verification code and activation link
 */
const sendVerificationEmail = async (toEmail, toName, token, otpCode = null, baseUrl = 'http://localhost:5173') => {
  const transport = await initTransporter();
  const verifyLink = `${baseUrl}/verify-email?token=${token}`;

  const otpBox = otpCode ? `
    <div style="background: #f5f3ff; border: 2px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-size: 0.8rem; color: #6d28d9; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
      <div style="font-size: 2.2rem; font-weight: 800; color: #4c1d95; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</div>
      <span style="font-size: 0.76rem; color: #6b7280; margin-top: 6px; display: block;">Enter this code on the screen to verify and activate your account (Valid for 15 minutes)</span>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #faf8ff; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px;
                border: 1px solid #ede9fe; padding: 36px; box-shadow: 0 4px 20px rgba(139,92,246,0.1); }
        .logo { font-size: 1.4rem; font-weight: 800; color: #6d28d9; margin-bottom: 4px; }
        .subtitle { font-size: 0.8rem; color: #9ca3af; margin-bottom: 28px; }
        h2 { color: #2e1065; font-size: 1.3rem; margin-bottom: 12px; }
        p { color: #4b5563; font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed);
               color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px;
               font-weight: 700; font-size: 0.95rem; margin: 8px 0 20px; text-align: center; }
        .note { font-size: 0.78rem; color: #9ca3af; border-top: 1px solid #f3f0ff;
                padding-top: 16px; margin-top: 8px; }
        .link-text { word-break: break-all; color: #8b5cf6; font-size: 0.8rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🏛️ Public Grievance Portal</div>
        <div class="subtitle">Citizen Redressal &amp; Resolution System</div>

        <h2>Verify Your Account</h2>
        <p>Hello <strong>${toName}</strong>,</p>
        <p>
          Thank you for registering with the Public Grievance Portal.
          Please use the 6-digit verification code below to activate your account:
        </p>

        ${otpBox}

        <p style="margin-bottom: 8px;">Or click the button below to verify instantly in your browser:</p>
        <div style="text-align: center;">
          <a href="${verifyLink}" class="btn">✓ Verify Account with 1-Click</a>
        </div>

        <div class="note">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span class="link-text">${verifyLink}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    let previewUrl = null;
    let messageId = null;

    if (transport) {
      const fromAddress = process.env.EMAIL_USER
        ? `"Public Grievance Portal" <${process.env.EMAIL_USER}>`
        : '"Public Grievance Portal" <noreply@citygov.org>';

      const info = await transport.sendMail({
        from: fromAddress,
        to: `"${toName}" <${toEmail}>`,
        subject: `🔑 ${otpCode ? `${otpCode} is your verification code — ` : ''}Public Grievance Portal`,
        html
      });
      messageId = info.messageId;
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n[Email Service]: Verification email dispatched to ${toEmail} (Code: ${otpCode || 'N/A'})`);
      if (previewUrl) {
        console.log(`[Email Service]: ✨ Preview URL → ${previewUrl}\n`);
      }
    } else {
      console.log(`\n[Email Service]: Local verification link for ${toEmail} → ${verifyLink} (Code: ${otpCode})\n`);
    }

    return { success: true, messageId, previewUrl, verifyLink, otpCode };
  } catch (err) {
    console.error('[Email Service Error]:', err.message);
    return { success: false, verifyLink, otpCode, error: err.message };
  }
};

/**
 * Send an email notification to citizen when their grievance status is updated
 */
const sendGrievanceStatusUpdateEmail = async (toEmail, toName, grievance, officer) => {
  const transport = await initTransporter();
  if (!transport) {
    console.log(`[Email Notification]: Status update notification for ${toEmail} skipped (no active mail transporter)`);
    return { success: false, message: 'No transport available' };
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return '#3b82f6';
      case 'Resolved': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const statusColor = getStatusColor(grievance.status);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #faf8ff; margin: 0; padding: 20px; }
        .card { max-width: 540px; margin: 0 auto; background: #fff; border-radius: 16px;
                border: 1px solid #ede9fe; padding: 32px; box-shadow: 0 4px 20px rgba(139,92,246,0.1); }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f0ff; padding-bottom: 14px; margin-bottom: 20px; }
        .logo { font-size: 1.25rem; font-weight: 800; color: #6d28d9; }
        .status-pill { background: ${statusColor}; color: #ffffff; padding: 4px 14px; border-radius: 999px; font-weight: 700; font-size: 0.82rem; text-transform: uppercase; }
        h2 { color: #1e1b4b; font-size: 1.2rem; margin: 0 0 12px 0; }
        p { color: #4b5563; font-size: 0.92rem; line-height: 1.6; margin: 0 0 14px 0; }
        .box { background: #f8fafc; border-left: 4px solid ${statusColor}; padding: 14px; border-radius: 8px; margin: 16px 0; }
        .box-title { font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px; }
        .box-desc { font-size: 0.9rem; color: #1e293b; margin: 0; }
        .meta { font-size: 0.8rem; color: #64748b; margin-top: 14px; }
        .footer { border-top: 1px solid #f3f0ff; padding-top: 16px; margin-top: 24px; font-size: 0.78rem; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">🏛️ Public Grievance Portal</div>
          <span class="status-pill">${grievance.status}</span>
        </div>

        <h2>Grievance Status Updated</h2>
        <p>Hello <strong>${toName}</strong>,</p>
        <p>
          There is an official status update on your registered grievance:
          <br/>
          <strong>"${grievance.title}"</strong>
        </p>

        <div class="box">
          <div class="box-title">Official Municipal Remarks:</div>
          <p class="box-desc">${grievance.adminRemarks || 'The grievance status has been updated by the municipal officer.'}</p>
        </div>

        <div class="meta">
          <strong>Category:</strong> ${grievance.category}<br/>
          <strong>Location:</strong> ${grievance.location}<br/>
          <strong>Handled By:</strong> ${officer ? officer.name : 'Municipal Officer'} (${officer && officer.role === 'superadmin' ? 'Chief Municipal Officer' : 'Municipal Officer'})
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:5173" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
            View in Portal
          </a>
        </div>

        <div class="footer">
          This is an automated notification from the Public Grievance Redressal System.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const fromAddress = process.env.EMAIL_USER
      ? `"Public Grievance Portal" <${process.env.EMAIL_USER}>`
      : '"Public Grievance Portal" <noreply@citygov.org>';

    const info = await transport.sendMail({
      from: fromAddress,
      to: `"${toName}" <${toEmail}>`,
      subject: `📢 Grievance Update [${grievance.status}]: ${grievance.title}`,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n[Email Notification]: Status update email sent to ${toEmail}`);
    if (previewUrl) {
      console.log(`[Email Notification]: ✨ Preview URL → ${previewUrl}\n`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error('[Email Notification Error]:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendVerificationEmail, sendGrievanceStatusUpdateEmail };
