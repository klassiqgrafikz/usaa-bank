import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/bank/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/forgot-password/:path*",
    "/reset-password/:path*",
    "/maintenance",
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images).*)",
  ],
};
