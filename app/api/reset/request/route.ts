import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "No account found with that email in this demo." },
      { status: 404 },
    );
  }

  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const { error: insertError } = await admin
    .from("login_codes")
    .insert({
      user_id: user.id,
      code,
      purpose: "password_reset",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  // Demo convenience: the code is returned inline since there is no email
  // delivery provider configured.
  return NextResponse.json({ ok: true, code, email: user.email });
}