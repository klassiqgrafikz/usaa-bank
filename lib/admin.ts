import { createClient } from "@/lib/supabase/client";
import type { Account, AdminAccountRow, AdminStats, AppSettings } from "@/lib/types";

type OpResult = { error: { message: string } | null };

export interface AdminApi {
  getSettings(): Promise<AppSettings | null>;
  updateSettings(p: Partial<AppSettings>): Promise<OpResult>;
  getStats(): Promise<AdminStats | null>;
  listAccounts(): Promise<AdminAccountRow[]>;
  updateMemberSince(args: { userId: string; memberSince: string }): Promise<OpResult>;
  listRestrictions(): Promise<Account[]>;
  addFunds(args: {
    accountNumber: string;
    amountCents: number;
    note?: string | null;
  }): Promise<{
    error: { message: string } | null;
    result: { name: string; balance_cents: number } | null;
  }>;
  restrictAccount(args: {
    accountNumber: string;
    reason: string;
    until: string | null;
  }): Promise<OpResult>;
  unrestrictAccount(accountNumber: string): Promise<OpResult>;
}

let adminApiPromise: Promise<AdminApi> | null = null;

function makeRealApi(supabase: ReturnType<typeof createClient>): AdminApi {
  return {
    async getSettings() {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      return (data ?? null) as AppSettings | null;
    },
    async updateSettings(p) {
      const { error } = await supabase.rpc("admin_update_settings", {
        p_maintenance_mode: p.maintenance_mode ?? null,
        p_tawk_enabled: p.tawk_enabled ?? null,
        p_tawk_property_id: p.tawk_property_id ?? null,
        p_tawk_widget_id: p.tawk_widget_id ?? null,
        p_tawk_full_link: p.tawk_full_link ?? null,
      });
      return { error };
    },
    async getStats() {
      const { data } = await supabase.rpc("admin_stats");
      return (data ?? null) as AdminStats | null;
    },
    async listAccounts() {
      const { data } = await supabase.rpc("admin_list_accounts");
      return (data ?? []) as AdminAccountRow[];
    },
    async updateMemberSince({ userId, memberSince }) {
      const { error } = await supabase.rpc("admin_update_member_since", {
        p_user_id: userId,
        p_member_since: memberSince,
      });
      return { error };
    },
    async listRestrictions() {
      const { data } = await supabase.rpc("admin_list_restrictions");
      return (data ?? []) as Account[];
    },
    async addFunds({ accountNumber, amountCents, note = null }) {
      const { data, error } = await supabase.rpc("admin_add_funds", {
        p_account_number: accountNumber,
        p_amount_cents: amountCents,
        p_note: note,
      });
      return {
        error,
        result: (data ?? null) as { name: string; balance_cents: number } | null,
      };
    },
    async restrictAccount({ accountNumber, reason, until }) {
      const { error } = await supabase.rpc("admin_restrict_account", {
        p_account_number: accountNumber,
        p_reason: reason,
        p_until: until,
      });
      return { error };
    },
    async unrestrictAccount(accountNumber) {
      const { error } = await supabase.rpc("admin_unrestrict_account", {
        p_account_number: accountNumber,
      });
      return { error };
    },
  };
}

export function getAdminApi(): Promise<AdminApi> {
  if (!adminApiPromise) {
    adminApiPromise = Promise.resolve(makeRealApi(createClient()));
  }
  return adminApiPromise;
}
