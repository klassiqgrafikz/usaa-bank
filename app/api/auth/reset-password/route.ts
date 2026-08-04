import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string; newPassword?: string };
  try {
    body = (await request.json()) as {
      email?: string;
      code?: string;
      newPassword?: string;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").trim();
  const newPassword = body.newPassword ?? "";

  if (!email || !code) {
    return NextResponse.json({ ok: false, error: "Enter the code from your email." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: otp, error: otpError } = await admin
      .from("auth_otps")
      .select("id, code_hash, expires_at")
      .eq("email", email)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      return NextResponse.json({ ok: false, error: "Couldn't verify that code. Try again." }, { status: 500 });
    }

    const expectedHash = createHash("sha256").update(code).digest("hex");
    if (!otp || !safeEqual(otp.code_hash, expectedHash)) {
      return NextResponse.json(
        { ok: false, error: "That code didn't match or has expired. Try again." },
        { status: 400 },
      );
    }

    const { data: users } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (users?.users ?? []).find((u: any) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "That code didn't match or has expired. Try again." },
        { status: 400 },
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    await admin
      .from("auth_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otp.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error && err.message.includes("not set")
            ? err.message
            : "Something went wrong resetting your password. Try again.",
      },
      { status: 500 },
    );
  }
}
