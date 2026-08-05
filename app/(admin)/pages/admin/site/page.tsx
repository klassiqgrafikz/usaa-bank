"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { getAdminApi } from "@/lib/admin";

export default function AdminSitePage() {
  const [maintenance, setMaintenance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminApi().then((api) =>
      api.getSettings().then((s) => {
        if (!active || !s) return;
        setMaintenance(s.maintenance_mode);
      }),
    );
    return () => {
      active = false;
    };
  }, []);

  async function toggle() {
    const next = !maintenance;
    setError(null);
    setSaved(false);
    setBusy(true);
    const api = await getAdminApi();
    const res = await api.updateSettings({ maintenance_mode: next });
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setMaintenance(next);
    setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-usaa-900">Website status</h1>
      <p className="mt-1 text-sm text-slate-500">
        Turn the entire website on or off. While off, visitors see an error
        screen — the admin portal stays accessible so you can switch it back
        on.
      </p>

      <div className="card mt-6 p-6">
        <div
          className={`flex items-center gap-2 text-sm font-semibold ${
            maintenance ? "text-crimson-600" : "text-emerald-600"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              maintenance ? "bg-crimson-600" : "bg-emerald-500"
            }`}
          />
          Website {maintenance ? "offline" : "online"}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-usaa-700" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Maintenance mode
              </p>
              <p className="text-xs text-slate-400">
                {maintenance
                  ? "Members see “Error occurred, try again later”"
                  : "The website is live to everyone"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={maintenance}
            onClick={toggle}
            disabled={busy}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              maintenance ? "bg-crimson-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                maintenance ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Website status saved.
          </p>
        )}
      </div>
    </div>
  );
}
