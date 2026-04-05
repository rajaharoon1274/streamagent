import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send 8-digit OTP verification email.
 * Professional HTML template matching StreamAgent branding.
 */
export async function sendVerificationEmail({ email, firstName, code }) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@stream-agent-ten.vercel.app'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your StreamAgent account</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1c;font-family:'Outfit',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#111626;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:22px;font-weight:800;
                background:linear-gradient(135deg,#4F6EF7,#A855F7);
                -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                StreamAgent
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#EEF2FF;">
                Verify your email
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#7B87A0;line-height:1.6;">
                Hi ${firstName || 'there'},<br/>
                Use the code below to verify your StreamAgent account.
                This code expires in <strong style="color:#EEF2FF;">15 minutes</strong>.
              </p>

              <!-- OTP Code Box -->
              <div style="background:#1E2540;border:1px solid rgba(79,110,247,0.3);
                border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <div style="font-size:11px;font-weight:700;color:#7B87A0;
                  text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">
                  Your verification code
                </div>
                <div style="font-size:44px;font-weight:800;letter-spacing:12px;
                  color:#EEF2FF;font-family:'Courier New',monospace;">
                  ${code}
                </div>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#7B87A0;line-height:1.6;">
                If you did not create a StreamAgent account, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:12px;color:#3D4560;">
                For security, never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#0C0F1C;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:#3D4560;text-align:center;">
                &copy; 2026 StreamAgent. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const { data, error } = await resend.emails.send({
    from: `StreamAgent <${fromEmail}>`,
    to: [email],
    subject: 'Your StreamAgent verification code',
    html,
  })

  if (error) {
    console.error('[Email] Failed to send verification email:', error)
    throw new Error(`Email delivery failed: ${error.message}`)
  }

  return data
}

/**
 * Send password reset email via Resend.
 * Branded HTML template with 15-minute expiry warning.
 */
export async function sendPasswordResetEmail({ email, firstName, resetUrl }) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@stream-agent-ten.vercel.app'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your StreamAgent password</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1c;font-family:'Outfit',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#111626;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:22px;font-weight:800;
                background:linear-gradient(135deg,#4F6EF7,#A855F7);
                -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                StreamAgent
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#EEF2FF;">
                Reset your password
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#7B87A0;line-height:1.6;">
                Hi ${firstName || 'there'},<br/>
                We received a request to reset your StreamAgent password.
                Click the button below to choose a new one.
                This link expires in <strong style="color:#EEF2FF;">15 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${resetUrl}"
                  style="display:inline-block;padding:14px 36px;border-radius:10px;
                    background:linear-gradient(135deg,#4F6EF7,#A855F7);
                    color:#fff;font-size:15px;font-weight:700;
                    text-decoration:none;letter-spacing:0.2px;">
                  Reset Password
                </a>
              </div>

              <!-- Fallback link -->
              <div style="background:#1E2540;border:1px solid rgba(255,255,255,0.06);
                border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#7B87A0;
                  text-transform:uppercase;letter-spacing:1px;">
                  Or copy this link
                </p>
                <p style="margin:0;font-size:12px;color:#4F6EF7;word-break:break-all;">
                  ${resetUrl}
                </p>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#7B87A0;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
                Your password will remain unchanged.
              </p>
              <p style="margin:0;font-size:12px;color:#3D4560;">
                For security, never share this link with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#0C0F1C;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:#3D4560;text-align:center;">
                &copy; 2026 StreamAgent. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const { data, error } = await resend.emails.send({
    from: `StreamAgent <${fromEmail}>`,
    to: [email],
    subject: 'Reset your StreamAgent password',
    html,
  })

  if (error) {
    console.error('[Email] Failed to send password reset email:', error)
    throw new Error(`Email delivery failed: ${error.message}`)
  }

  return data
}
