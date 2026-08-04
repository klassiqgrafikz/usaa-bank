"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { formatDate, initials } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Profile } from "@/lib/types";

const branches = [
  "Army", "Navy", "Air Force", "Marine Corps", "Space Force",
  "Coast Guard", "National Guard", "Reserve", "Veteran / Former service",
];

export function ProfileClient({
  profile,
  onChanged,
}: {
  profile: Profile | null;
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
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
    });
  }, []);

  async function uploadAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setAvatarMsg("Photo must be 4MB or smaller.");
      return;
    }
    setUploading(true);
    setAvatarMsg(null);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed on to upload a photo.");
      const ext =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw new Error(upErr.message);
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const api = await getBankApi();
      const { error } = await api.updateProfile({ avatar_url: url });
      if (error) throw new Error(error.message);
      setAvatarUrl(url);
      onChanged?.();
      router.refresh();
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setAvatarMsg(null);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);
      }
      const api = await getBankApi();
      const { error } = await api.updateProfile({ avatar_url: null });
      if (error) throw new Error(error.message);
      setAvatarUrl(null);
      onChanged?.();
      router.refresh();
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Failed to remove photo.");
    } finally {
      setUploading(false);
    }
  }

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
            <h2 className="font-bold text-usaa-900">Profile photo</h2>
            <div className="mt-4 flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-usaa-100"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-usaa-700 text-lg font-bold text-white">
                  {profile
                    ? initials(profile.first_name, profile.last_name)
                    : "U"}
                </div>
              )}
              <div className="min-w-0">
                <label className="btn-secondary inline-flex cursor-pointer">
                  <Camera className="h-4 w-4" />
                  {uploading ? "Saving…" : "Upload photo"}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadAvatar}
                  />
                </label>
                {avatarUrl && (
                  <button
                    onClick={removeAvatar}
                    disabled={uploading}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-600 hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove photo
                  </button>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG or WebP · up to 4MB
                </p>
                {avatarMsg && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{avatarMsg}</p>
                )}
              </div>
            </div>
          </div>

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
              The information you provide is used to personalize your banking
              experience and is protected by our security controls. You can
              update your details here at any time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}