"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, ImagePlus, MapPin, X } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { getBankApi } from "@/lib/bank";
import type { Account } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/heic", "image/webp"];

function CheckUpload({
  side,
  file,
  preview,
  onPick,
  onRemove,
}: {
  side: "front" | "back";
  file: File | null;
  preview: string | null;
  onPick: (f: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    onPick(f);
  }

  return (
    <div
      className={
        file && preview
          ? "rounded-lg border-2 border-emerald-500 bg-emerald-50/40 p-3"
          : "rounded-lg border-2 border-dashed border-slate-300 p-3 hover:border-usaa-400"
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {file && preview ? (
        <div>
          <div className="relative">
            <div className="relative h-36 w-full overflow-hidden rounded-md">
              <Image
                src={preview}
                alt={`${side} of check`}
                fill
                unoptimized
                sizes="100%"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${side} of check`}
              className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </span>
            <button type="button" onClick={() => inputRef.current?.click()} className="link shrink-0">
              Replace
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-md p-6 text-sm font-medium text-slate-500 hover:text-usaa-700"
        >
          {side === "front" ? (
            <ImagePlus className="h-6 w-6" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
          {side === "front" ? "Add front of check" : "Add back of check"}
          <span className="text-xs text-slate-400">
            JPG, PNG, HEIC or WebP · up to 10&nbsp;MB
          </span>
        </button>
      )}
    </div>
  );
}

export function DepositsClient({
  accounts,
  onChanged,
}: {
  accounts: Account[];
  onChanged?: () => void;
}) {
  const depositTargets = accounts.filter((a) => a.type === "checking" || a.type === "savings");

  const [targetId, setTargetId] = useState(depositTargets[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(
    side: "front" | "back",
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (u: string | null) => void,
  ) {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError(`${side === "front" ? "Front" : "Back"} image must be a JPG, PNG, HEIC or WebP photo.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Check images must be 10 MB or smaller.");
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function removeFile(
    side: "front" | "back",
    setFile: (f: File | null) => void,
    setPreview: (u: string | null) => void,
  ) {
    setFile(null);
    if (side === "front" && frontPreview) URL.revokeObjectURL(frontPreview);
    if (side === "back" && backPreview) URL.revokeObjectURL(backPreview);
    setPreview(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter a valid check amount.");
      return;
    }
    if (!front || !back) {
      setError("Add a photo of the front and back of the check.");
      return;
    }
    setSubmitting(true);
    const api = await getBankApi();
    const { error: insertError } = await api.depositCheck({
      accountId: targetId,
      amountCents: cents,
      frontImage: front,
      backImage: back,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
    onChanged?.();
  }

  const checking = depositTargets[0];

  return (
    <>
      <PageHeader title="Deposits" subtitle="Deposit a check or set up direct deposit." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card p-6">
          <h2 className="text-lg font-bold text-usaa-900">Mobile check deposit</h2>
          <p className="mt-1 text-sm text-slate-500">
            Snap the front and back of a signed check, then submit.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Deposit to</label>
              <select className="input" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                {depositTargets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input className="input pl-7" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CheckUpload
              side="front"
              file={front}
              preview={frontPreview}
              onPick={(f) => pickFile("front", f, setFront, setFrontPreview)}
              onRemove={() => removeFile("front", setFront, setFrontPreview)}
            />
            <CheckUpload
              side="back"
              file={back}
              preview={backPreview}
              onPick={(f) => pickFile("back", f, setBack, setBackPreview)}
              onRemove={() => removeFile("back", setBack, setBackPreview)}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {done && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Check submitted! It&apos;s showing as pending.
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
            {submitting ? "Uploading check…" : "Submit deposit"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">Direct deposit</h2>
            <p className="mt-1 text-sm text-slate-500">
              Share these details with your employer to receive paychecks faster.
            </p>
            {checking && (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Deposit account</dt>
                  <dd className="font-mono">{checking.account_number}</dd>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Routing number</dt>
                  <dd className="font-mono">{checking.routing_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Account type</dt>
                  <dd className="font-medium text-slate-800">Checking</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">Deposit funds into your account</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add cash or checks at a fee-free ATM.
            </p>
            <button className="btn-secondary mt-4 w-full">
              <MapPin className="h-4 w-4" /> Find a fee-free ATM
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
