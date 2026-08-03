"use client";

import { useBankData } from "@/lib/use-bank-data";
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  const { data, error, reload } = useBankData(async (api) => {
    const profile = await api.getProfile();
    return { profile };
  });

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading profile…</p>;
  }

  return (
    <ProfileClient
      profile={data.profile}
      onChanged={reload}
    />
  );
}