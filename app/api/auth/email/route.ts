import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recoveryEmail, sendEmail, welcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_TYPES = ["signup", "recovery"] as const;
type EmailType = (typeof EMAIL_TYPES)[number];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: { type?: string; email?: string; firstName?: string };
  try {
    body = (await request.json()) as {
      type?: string;
      email?: string;
      firstName?: string;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const type = body.type as EmailType;
  const email = (body.email ?? "").trim().toLowerCase();

  if (!EMAIL_TYPES.includes(type)) {
    return NextResponse.json({ ok: false, error: "Unknown email type." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;

  try {
    const admin = createAdminClient();
    const redirectTo = `${origin}/auth/callback?next=${
      type === "recovery" ? "/reset-password" : "/bank/dashboard"
    }`;

    const { data, error } =
      type === "recovery"
        ? await admin.auth.admin.generateLink({ type, email, options: { redirectTo } })
        : await admin.auth.admin.generateLink({
            type: "signup",
            email,
            password: " ",
            options: { redirectTo },
          });

    let actionLink: string | null = null;
    if (error) {
      // If a link can't be minted (e.g. already-confirmed user), still send a
      // link-free email rather than failing the resend.
      if (type === "recovery") {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 },
        );
      }
    } else {
      actionLink = data?.properties?.action_link ?? null;
    }

    const tpl =
      type === "recovery"
        ? recoveryEmail(actionLink ?? `${origin}/login`)
        : welcomeEmail(body.firstName ?? "", actionLink);

    const result = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error && err.message.includes("not set")
            ? err.message
            : "Something went wrong sending that email. Try again.",
      },
      { status: 500 },
    );
  }
}
