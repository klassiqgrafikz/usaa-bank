"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { formatDate } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Profile } from "@/lib/types";

const branches = [
  "Army", "Navy", "Air Force", "Marine Corps", "Space Force",
  "Coast Guard", "National Guard", "Reserve", "Veteran / Former service",
];

export function ProfileClient({
  profile,
  email,
  onChanged,
}: {
  profile: Profile | null;
  email: string;
  onChanged?: () => void;
}) {
  const [first, setFirst] = useState(profile?.first_name ?? "");
  const [last, setLast] = useState(profile?.last_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [addr, setAddr] = useState(profile?.address_line1 ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const [zip, setZip] = useState(profile?.zip ?? "");
  const [branch, setBranch] = useState(profile?.military_branch ?? "Army");

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const api = await getBankApi();
    const { error } = await api.updateProfile({
      first_name: first,
      last_name: last,
      phone: phone || null,
      address_line1: addr || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      military_branch: branch,
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Profile saved.");
    onChanged?.();
  }

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your contact information and membership details."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="card p-6 lg:col-span-2">
          <h2 className="font-bold text-usaa-900">Contact information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First name</label>
              <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} required />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" value={last} onChange={(e) => setLast(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} disabled />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="123 Main St" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">State</label>
                <input className="input" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
              </div>
              <div>
                <label className="label">ZIP</label>
                <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} maxLength={5} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Military affiliation</label>
              <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
                {branches.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary mt-5">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">Membership</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Member since</dt>
                <dd className="font-medium text-slate-800">
                  {profile?.member_since ? formatDate(profile.member_since) : "—"}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Branch</dt>
                <dd className="font-medium text-slate-800">{branch}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Member ID</dt>
                <dd className="font-mono text-slate-800">
                  {profile?.id ? profile.id.slice(0, 8).toUpperCase() : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">About your data</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              All personal information here is stored only in your demo
              Supabase project and can be reset at any time from the Security
              page. Nothing is shared or sent anywhere.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}