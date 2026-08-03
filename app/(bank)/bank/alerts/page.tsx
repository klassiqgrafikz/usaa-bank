"use client";

import { useBankData } from "@/lib/use-bank-data";
import { AlertsClient } from "./alerts-client";
import { isMockMode } from "@/lib/mock";

export default function AlertsPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const [alerts, prefs] = await Promise.all([
      api.getAlerts(),
      api.getAlertPrefs(),
    ]);
    return { alerts, prefs };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading alerts…</p>;
  }

  return (
    <AlertsClient
      alerts={data.alerts}
      prefs={data.prefs}
      onChanged={reload}
    />
  );
}