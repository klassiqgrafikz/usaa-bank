"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { getAdminApi } from "@/lib/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminAccountRow } from "@/lib/types";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminAccountsPage() {
  const [rows, setRows] = useState<AdminAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const api = await getAdminApi();
    const list = await api.listAccounts();
    setRows(list);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getAdminApi().then((api) =>
      api.listAccounts().then((list) => {
        if (active) {
          setRows(list);
          setLoading(false);
        }
      }),
    );
    return () => {
      active = false;
    };
  }, []);

  function startEdit(accountId: string, memberSince: string) {
    setError(null);
    setEditing((e) => ({ ...e, [accountId]: toLocalInput(memberSince) }));
  }

  function cancelEdit(accountId: string) {
    setEditing((e) => {
      const n = { ...e };
      delete n[accountId];
      return n;
    });
  }

  async function saveEdit(accountId: string, userId: string) {
    const raw = editing[accountId];
    if (!raw) return;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      setError("Enter a valid membership date and time.");
      return;
    }
    setSavingId(accountId);
    setError(null);
    setMessage(null);
    const api = await getAdminApi();
    const res = await api.updateMemberSince({
      userId,
      memberSince: parsed.toISOString(),
    });
    setSavingId(null);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setMessage("Membership date updated.");
    cancelEdit(accountId);
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-usaa-900">All accounts</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every account created plus each member&apos;s membership date. You can
        edit the membership date, year and time directly.
      </p>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <div className="card mt-6 overflow-hidden">
        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Number</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Member since</th>
                  <th className="px-4 py-3 font-semibold text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.account_id} className="align-top hover:bg-slate-50/60">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-slate-800">{r.member_name || "—"}</p>
                      <p className="text-xs text-slate-400">{r.email}</p>
                      {r.restricted && (
                        <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Restricted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{r.account_name}</p>
                      <p className="text-xs capitalize text-slate-400">
                        {r.account_type.replace("_", " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {r.account_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(r.balance_cents)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(r.available_cents)} available
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      {editing[r.account_id] !== undefined ? (
                        <input
                          type="datetime-local"
                          className="input py-1.5 text-sm"
                          value={editing[r.account_id]}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [r.account_id]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="text-slate-500">{formatDate(r.member_since)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editing[r.account_id] !== undefined ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => saveEdit(r.account_id, r.user_id)}
                            disabled={savingId === r.account_id}
                            className="rounded-md bg-usaa-700 p-1.5 text-white transition-colors hover:bg-usaa-800 disabled:opacity-50"
                            aria-label="Save membership date"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => cancelEdit(r.account_id)}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50"
                            aria-label="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(r.account_id, r.member_since)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-usaa-700 transition-colors hover:bg-usaa-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}