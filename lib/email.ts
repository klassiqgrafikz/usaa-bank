const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM =
  process.env.RESEND_FROM ?? "USAA Online <no-reply@usaa-bank.app>";

const NAVY = "#0b2342";
const NAVY_SOFT = "#10325c";
const GOLD = "#f0ab00";
const CRIMSON = "#c8102e";
const LIGHT = "#eef4fb";
const SLATE = "#64748b";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "Email service is not configured." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `We couldn't send that email right now (${res.status}). Please try again shortly.`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Email service is unreachable. Try again." };
  }
}

function shell(content: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:${LIGHT};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${NAVY};">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <span style="font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">USAA</span>
          <span style="font-size:26px;font-weight:800;color:${GOLD};">.</span>
          <div style="font-size:12px;letter-spacing:4px;color:#b3cdea;margin-top:2px;">ONLINE BANKING</div>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background-color:${GOLD};height:3px;padding:0;"></td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:32px 16px 8px;">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(11,35,66,0.12);">
            <tr>
              <td style="padding:36px 36px 28px;color:${NAVY};font-size:15px;line-height:1.6;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:4px 36px 8px;color:${SLATE};font-size:12px;line-height:1.5;">
                <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
                  This is an automated message from USAA Online Banking. Please do not reply to this email.<br/>
                  USAA — protecting the armed forces community for over 100 years.
                </div>
              </td>
            </tr>
          </table>
          <p style="color:${SLATE};font-size:11px;margin:18px 0 32px;">If you didn't request this email, no further action is needed.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function otpEmail(code: string): { subject: string; html: string } {
  return {
    subject: `Your USAA verification code is ${code}`,
    html: shell(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;">Two-step verification</h1>
      <p style="margin:0 0 22px;color:${SLATE};">
        Enter this 6-digit code to finish signing on to your account. It expires
        in 10 minutes.
      </p>
      <div style="text-align:center;padding:18px 12px;margin:0 0 20px;background-color:${LIGHT};border-radius:10px;border:1px solid #d8e6f6;">
        <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:${NAVY};">${code}</span>
      </div>
      <p style="margin:0 0 6px;color:${SLATE};">
        Didn't request this? Someone may be trying to access your account.
        <strong style="color:${NAVY};">Don't share this code with anyone.</strong>
        USAA will never call or text you asking for your code.
      </p>
    `),
  };
}

export function welcomeEmail(
  firstName: string,
  confirmUrl: string | null,
): { subject: string; html: string } {
  const action =
    confirmUrl && confirmUrl.startsWith("http")
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr>
          <td align="center" style="border-radius:8px;">
            <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;background-color:${CRIMSON};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">Confirm my email</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 6px;color:${SLATE};">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 18px;font-size:12px;word-break:break-all;color:${NAVY_SOFT};">${confirmUrl}</p>`
      : `
      <p style="margin:0 0 20px;color:${SLATE};">
        You can sign on at any time with the email and password you chose.
      </p>`;

  return {
    subject: "Welcome to USAA online banking",
    html: shell(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;">Welcome${firstName ? `, ${firstName}` : ""}!</h1>
      <p style="margin:0 0 20px;color:${SLATE};">
        Your account is ready. To finish setting up, confirm your email address
        by tapping the button below.
      </p>
      ${action}
      <p style="margin:0;color:${SLATE};">
        Thank you for banking with USAA.
      </p>
    `),
  };
}

export function recoveryEmail(link: string): { subject: string; html: string } {
  return {
    subject: "Reset your USAA password",
    html: shell(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;">Reset your password</h1>
      <p style="margin:0 0 20px;color:${SLATE};">
        We received a request to reset the password on your USAA online banking
        account. Tap the button below to choose a new one. This link expires in
        30 minutes.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr>
          <td align="center" style="border-radius:8px;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;background-color:${CRIMSON};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">Choose a new password</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 6px;color:${SLATE};">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 18px;font-size:12px;word-break:break-all;color:${NAVY_SOFT};">${link}</p>
      <p style="margin:0;color:${SLATE};">
        If you didn't request this, you can safely ignore this email — your
        password won't change.
      </p>
    `),
  };
}
