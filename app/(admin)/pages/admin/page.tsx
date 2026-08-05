"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, UserRound, Wrench, MessageSquare } from "lucide-react";
import { getAdminApi } from "@/lib/admin";
import type { AdminStats } from "@/lib/types";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminApi().then((api) =>
      api.getStats().then((s) => {
        if (active) {
          if (!s) setError("Could not load stats.");
          else setStats(s);
        }
      }),
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const cards = [
    {
      label: "Total accounts",
      value: stats ? String(stats.total_accounts) : "—",
      icon: UserRound,
      tone: "bg-usaa-50 text-usaa-700",
    },
    {
      label: "Active restrictions",
      value: stats ? String(stats.restricted_count) : "—",
      icon: ShieldAlert,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Live chat",
      value: stats ? (stats.tawk_enabled ? "On" : "Off") : "—",
      icon: MessageSquare,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Website status",
      value: stats ? (stats.maintenance_mode ? "Offline" : "Online") : "—",
      icon: Wrench,
      tone: stats?.maintenance_mode
        ? "bg-crimson-50 text-crimson-600"
        : "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-usaa-900">Admin overview</h1>
      <p className="mt-1 text-sm text-slate-500">
        Site-wide controls for your banking platform.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}
            >
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-usaa-900">{c.value}</p>
            <p className="text-sm text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
