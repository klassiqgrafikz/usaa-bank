import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, code, newPassword } = (await request.json()) as {
    email?: string;
    code?: string;
    newPassword?: string;
  };

  if (!email || !code || !newPassword) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  const { data: matches, error: codeError } = await admin
    .from("login_codes")
    .select("id")
    .eq("user_id", user.id)
    .eq("code", code)
    .eq("purpose", "password_reset")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .limit(1);

  if (codeError || !matches || matches.length === 0) {
    return NextResponse.json(
      { ok: false, error: "That code is invalid or expired." },
      { status: 400 },
    );
  }

  await admin.from("login_codes").update({ used: true }).eq("id", matches[0].id);

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}