import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, opts: { showSign?: boolean } = {}) {
  const sign = cents > 0 && opts.showSign ? "+" : "";
  const abs = Math.abs(cents);
  const value = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(abs / 100);
  return `${cents < 0 ? "-" : ""}${sign}${value}`;
}

export function formatDate(input: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

export function formatDateShort(input: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}

export function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function maskAccount(accountNumber: string) {
  const digits = accountNumber.replace(/\D/g, "");
  return `••${digits.slice(-4)}`;
}

export function maskLast4(value: string) {
  const digits = value.replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
}

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function timeAgo(input: string | Date) {
  const diff = Date.now() - new Date(input).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}