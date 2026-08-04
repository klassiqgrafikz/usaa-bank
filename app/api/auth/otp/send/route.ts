import { createHash, randomInt } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { otpEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    await admin.from("auth_otps").delete().eq("email", email).is("used_at", null);

    const code = String(randomInt(100000, 1000000));
    const { error: insertError } = await admin.from("auth_otps").insert({
      email,
      code_hash: createHash("sha256").update(code).digest("hex"),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (insertError) {
      return NextResponse.json(
        { ok: false, error: "We couldn't generate a code right now. Try again." },
        { status: 500 },
      );
    }

    const tpl = otpEmail(code);
    const result = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
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
            : "Something went wrong sending that code. Try again.",
      },
      { status: 500 },
    );
  }
}
