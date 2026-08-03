"use client";

import { useBankData } from "@/lib/use-bank-data";
import { ProfileClient } from "./profile-client";
import { isMockMode } from "@/lib/mock";

export default function ProfilePage() {
  const { data, error, reload } = useBankData(async (api) => {
    const profile = await api.getProfile();
    return { profile };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading profile…</p>;
  }

  return (
    <ProfileClient
      profile={data.profile}
      email={isMockMode() ? "demo@usaa-demo.com" : ""}
      onChanged={reload}
    />
  );
}