import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { firstName?: string; lastName?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!firstName || !lastName) {
    return NextResponse.json({ ok: false, error: "Enter your first and last name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;

  try {
    const admin = createAdminClient();

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (createError) {
      const message = /already/i.test(createError.message)
        ? "An account with this email already exists."
        : createError.message;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    // Welcome/confirm email via Resend — best effort, never blocks signup.
    try {
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password: " ",
        options: { redirectTo: `${origin}/auth/callback?next=/bank/dashboard` },
      });
      const tpl = welcomeEmail(firstName, linkData?.properties?.action_link ?? null);
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    } catch {
      // welcome email is optional
    }

    // Sign the new member in immediately so they land in the dashboard.
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    });

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return NextResponse.json({ ok: true, session: !signInError });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error && err.message.includes("not set")
            ? err.message
            : "Something went wrong creating your account. Try again.",
      },
      { status: 500 },
    );
  }
}
