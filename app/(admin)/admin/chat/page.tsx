"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MessageSquare } from "lucide-react";
import { getAdminApi } from "@/lib/admin";

export default function AdminChatPage() {
  const [enabled, setEnabled] = useState(false);
  const [fullLink, setFullLink] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [widgetId, setWidgetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminApi().then((api) =>
      api.getSettings().then((s) => {
        if (!active || !s) return;
        setEnabled(s.tawk_enabled);
        setFullLink(s.tawk_full_link ?? "");
        setPropertyId(s.tawk_property_id ?? "");
        setWidgetId(s.tawk_widget_id ?? "");
      }),
    );
    return () => {
      active = false;
    };
  }, []);

  const preview = fullLink.trim()
    ? fullLink.trim()
    : propertyId.trim() && widgetId.trim()
      ? `https://embed.tawk.to/${propertyId.trim()}/${widgetId.trim()}`
      : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const link = fullLink.trim() || null;
    const property = propertyId.trim() || null;
    const widget = widgetId.trim() || null;

    if (enabled && !link && (!property || !widget)) {
      setError(
        "Provide either the full tawk.to embed link, or both the property ID and widget ID.",
      );
      return;
    }

    setBusy(true);
    const api = await getAdminApi();
    const res = await api.updateSettings({
      tawk_enabled: enabled,
      tawk_full_link: link,
      tawk_property_id: property,
      tawk_widget_id: widget,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-usaa-900">Live chat (tawk.to)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Connect your tawk.to chat widget. When enabled it appears on every
        page of the member site.
      </p>

      <form onSubmit={save} className="card mt-6 p-6">
        <label className="label">Full embed link</label>
        <input
          className="input"
          placeholder="https://embed.tawk.to/xxxxxxxxxxxxxxxx/xxxxxxxxxxxxxxxx"
          value={fullLink}
          onChange={(e) => setFullLink(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-400">
          Paste the script src from your tawk.to dashboard — or fill in the
          two IDs below instead.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Property ID</label>
            <input
              className="input"
              placeholder="67..."
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Widget ID</label>
            <input
              className="input"
              placeholder="1..."
              value={widgetId}
              onChange={(e) => setWidgetId(e.target.value)}
            />
          </div>
        </div>

        {preview && (
          <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
            {preview}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-usaa-700" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Chat widget</p>
              <p className="text-xs text-slate-400">
                {enabled ? "Visible to members" : "Hidden from members"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-usaa-700" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                enabled ? "left-[22px]" : "left-0.5"
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
            Chat settings saved.
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-5">
          {busy ? "Saving…" : "Save chat settings"}
        </button>
      </form>
    </div>
  );
}
