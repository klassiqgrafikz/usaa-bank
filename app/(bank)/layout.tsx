import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/mock";
import { BankShell } from "@/components/bank-shell";
import { EnsureData } from "@/components/ensure-data";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: Profile | null = null;

  if (isMockMode()) {
    return (
      <BankShell profile={null}>
        {children}
      </BankShell>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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