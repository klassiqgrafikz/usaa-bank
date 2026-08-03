import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BankShell } from "@/components/bank-shell";
import { EnsureData } from "@/components/ensure-data";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <BankShell profile={profile}>
      <EnsureData />
      {children}
    </BankShell>
  );
}
