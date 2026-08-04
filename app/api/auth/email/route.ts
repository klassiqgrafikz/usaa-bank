import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, welcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

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

  const type = body.type;
  const email = (body.email ?? "").trim().toLowerCase();

  if (type !== "signup") {
    return NextResponse.json({ ok: false, error: "Unknown email type." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;

  try {
    const admin = createAdminClient();
    const redirectTo = `${origin}/auth/callback?next=/bank/dashboard`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password: " ",
      options: { redirectTo },
    });

    let actionLink: string | null = null;
    if (!error) {
      actionLink = data?.properties?.action_link ?? null;
    }

    const tpl = welcomeEmail(body.firstName ?? "", actionLink);
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
