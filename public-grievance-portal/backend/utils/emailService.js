const nodemailer = require('nodemailer');

/**
 * Email Service Utility
 * Concepts Covered:
 * - Node.js modules (require/export pattern)
 * - Async/Await pattern
 * - Nodemailer for transactional emails
 *
 * Uses Ethereal (https://ethereal.email) for local development:
 * - No real email credentials required
 * - Check the console for a "Preview URL" after registering
 * - Click the URL to see the verification email in your browser
 *
 * For production, replace createTestAccount() with real SMTP config
 * (e.g. Gmail + App Password, SendGrid, Mailgun, etc.)
 */

let transporter = null;
let testAccount = null;

/**
 * Initialize the Nodemailer transporter using an auto-generated Ethereal
 * test account. This runs once on first use (lazy initialization).
 */
const initTransporter = async () => {
  if (transporter) return transporter;

  try {
    // Disable TLS rejectUnauthorized for development test account creation
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    testAccount = await nodemailer.createTestAccount();

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

    console.log('\n[Email Service]: Using Ethereal test account');
    console.log(`[Email Service]: User: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[Email Service]: Could not connect to Ethereal SMTP, using direct verification link mode:', err.message);
    return null;
  }
};

/**
 * Send an email verification link to a newly registered user.
 * @param {string} toEmail    - Recipient email address
 * @param {string} toName     - Recipient display name
 * @param {string} token      - Unique verification token (UUID or random hex)
 * @param {string} baseUrl    - Frontend base URL (e.g. http://localhost:5173)
 */
const sendVerificationEmail = async (toEmail, toName, token, baseUrl = 'http://localhost:5173') => {
  const transport = await initTransporter();
  const verifyLink = `${baseUrl}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #faf8ff; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px;
                border: 1px solid #ede9fe; padding: 36px; box-shadow: 0 4px 20px rgba(139,92,246,0.1); }
        .logo { font-size: 1.4rem; font-weight: 800; color: #6d28d9; margin-bottom: 4px; }
        .subtitle { font-size: 0.8rem; color: #9ca3af; margin-bottom: 28px; }
        h2 { color: #2e1065; font-size: 1.3rem; margin-bottom: 12px; }
        p { color: #4b5563; font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed);
               color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px;
               font-weight: 700; font-size: 1rem; margin: 8px 0 24px; }
        .note { font-size: 0.78rem; color: #9ca3af; border-top: 1px solid #f3f0ff;
                padding-top: 16px; margin-top: 8px; }
        .link-text { word-break: break-all; color: #8b5cf6; font-size: 0.8rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🏛️ Public Grievance Portal</div>
        <div class="subtitle">Citizen Redressal &amp; Resolution System</div>

        <h2>Verify Your Email Address</h2>
        <p>Hello <strong>${toName}</strong>,</p>
        <p>
          Thank you for registering with the Public Grievance Portal.
          Please click the button below to verify your email address and activate your account.
        </p>

        <a href="${verifyLink}" class="btn">✓ Verify My Email</a>

        <p>This verification link will expire in <strong>24 hours</strong>.</p>

        <div class="note">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span class="link-text">${verifyLink}</span>
          <br/><br/>
          If you did not create an account, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    let previewUrl = null;
    let messageId = null;

    if (transport) {
      const info = await transport.sendMail({
        from: '"Public Grievance Portal" <noreply@citygov.org>',
        to: `"${toName}" <${toEmail}>`,
        subject: '✉️ Verify your email — Public Grievance Portal',
        html
      });
      messageId = info.messageId;
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n[Email Service]: Verification email sent to ${toEmail}`);
      if (previewUrl) {
        console.log(`[Email Service]: ✨ Preview URL → ${previewUrl}\n`);
      }
    } else {
      console.log(`\n[Email Service]: Local verification link for ${toEmail} → ${verifyLink}\n`);
    }

    return { success: true, messageId, previewUrl, verifyLink };
  } catch (err) {
    console.error('[Email Service Error]:', err.message);
    return { success: false, verifyLink, error: err.message };
  }
};

module.exports = { sendVerificationEmail };
