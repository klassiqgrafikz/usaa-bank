"use client";

import { createMockData, type MockDb } from "@/lib/mock";

const KEY = "usaa_mock_db_v1";

export function loadDb(): MockDb | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDb;
    if (!parsed.accounts || parsed.accounts.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getDb(): MockDb {
  const existing = loadDb();
  if (existing) return existing;
  const fresh = createMockData();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db: MockDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDb() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function mutate(fn: (db: MockDb) => void) {
  const db = getDb();
  fn(db);
  saveDb(db);
}

export function freshId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}