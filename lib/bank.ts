import { createClient } from "@/lib/supabase/client";
import type {
  Account,
  AlertItem,
  AlertPreference,
  BillPayment,
  Card,
  Dispute,
  Payee,
  Profile,
  Transaction,
  Transfer,
  ZelleContact,
  ZelleTransfer,
  InvestmentHolding,
} from "@/lib/types";

type OpResult = { error: { message: string } | null };

export interface BankApi {
  getProfile(): Promise<Profile | null>;
  updateProfile(p: Partial<Profile>): Promise<OpResult>;
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | null>;
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByAccount(accountId: string): Promise<Transaction[]>;
  getTransfers(): Promise<Transfer[]>;
  getPayees(): Promise<Payee[]>;
  getPayments(): Promise<BillPayment[]>;
  getZelleContacts(): Promise<ZelleContact[]>;
  getZelleTransfers(): Promise<ZelleTransfer[]>;
  getCards(): Promise<Card[]>;
  getCardsByAccount(accountId: string): Promise<Card[]>;
  getHoldings(): Promise<InvestmentHolding[]>;
  getAlerts(): Promise<AlertItem[]>;
  getRecentAlerts(limit?: number): Promise<AlertItem[]>;
  getUnreadAlertCount(): Promise<number>;
  markAllAlertsRead(): Promise<OpResult>;
  getAlertPrefs(): Promise<AlertPreference | null>;
  setAlertPrefs(p: Partial<AlertPreference>): Promise<OpResult>;
  markAlertRead(id: string): Promise<OpResult>;
  getDisputes(): Promise<Dispute[]>;
  createTransfer(args: {
    internal: boolean;
    fromId: string;
    toId?: string;
    externalName?: string;
    externalAccount?: string;
    amountCents: number;
    schedule?: string;
    frequency?: string | null;
    note?: string | null;
    isWire?: boolean;
  }): Promise<{
    error: { message: string } | null;
    transferId: string | null;
  }>;
  createBillPayment(args: {
    payeeId: string;
    fromId: string;
    amountCents: number;
    schedule?: string;
    frequency?: string | null;
  }): Promise<OpResult>;
  addPayee(p: { name: string; category: string; phone?: string | null }): Promise<OpResult>;
  createZelleTransfer(args: {
    contactId: string;
    amountCents: number;
    direction: string;
    note?: string | null;
  }): Promise<OpResult>;
  addZelleContact(c: { name: string; emailOrPhone: string; bank?: string | null }): Promise<OpResult>;
  addDeposit(args: { accountId: string; amountCents: number }): Promise<OpResult>;
  setCardStatus(id: string, status: string): Promise<OpResult>;
  issueVirtualCard(args: {
    accountId: string;
    network: "Visa" | "Mastercard";
  }): Promise<OpResult>;
  deleteCard(id: string): Promise<OpResult>;
  fileDispute(d: { ref: string; amountCents: number; reason: string }): Promise<OpResult>;
}

let realApiPromise: Promise<BankApi> | null = null;

// Real (Supabase) implementation — every read goes through the browser client
// so RLS still applies; balances are mutated via the SQL functions.
function makeRealApi(supabase: ReturnType<typeof createClient>): BankApi {
  const select = async <T>(table: string, limit?: number): Promise<T[]> => {
    let q = supabase.from(table).select("*");
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return (data ?? []) as T[];
  };

  return {
    async getProfile() {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return (data ?? null) as Profile | null;
    },
    async updateProfile(p) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: "You must be signed on to update your profile." } };
      }
      const { error } = await supabase.from("profiles").update(p).eq("user_id", user.id);
      return { error };
    },
    async getAccounts() {
      return select<Account>("accounts");
    },
    async getAccount(id) {
      const { data } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
      return (data ?? null) as Account | null;
    },
    async getTransactions(limit = 500) {
      return select<Transaction>("transactions", limit);
    },
    async getTransactionsByAccount(accountId) {
      const { data } = await supabase.from("transactions").select("*").eq("account_id", accountId).order("posted_at", { ascending: false });
      return (data ?? []) as Transaction[];
    },
    async getTransfers() {
      return select<Transfer>("transfers");
    },
    async getPayees() {
      return select<Payee>("payees");
    },
    async getPayments() {
      return select<BillPayment>("bill_payments");
    },
    async getZelleContacts() {
      return select<ZelleContact>("zelle_contacts");
    },
    async getZelleTransfers() {
      return select<ZelleTransfer>("zelle_transfers");
    },
    async getCards() {
      return select<Card>("cards");
    },
    async getCardsByAccount(accountId) {
      const { data } = await supabase.from("cards").select("*").eq("account_id", accountId);
      return (data ?? []) as Card[];
    },
    async getHoldings() {
      return select<InvestmentHolding>("investment_holdings");
    },
    async getAlerts() {
      return select<AlertItem>("alerts");
    },
    async getRecentAlerts(limit = 8) {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as AlertItem[];
    },
    async getUnreadAlertCount() {
      const { count } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
    async markAllAlertsRead() {
      const { error } = await supabase
        .from("alerts")
        .update({ read: true })
        .eq("read", false);
      return { error };
    },
    async getAlertPrefs() {
      const { data } = await supabase.from("alert_preferences").select("*").maybeSingle();
      return (data ?? null) as AlertPreference | null;
    },
    async setAlertPrefs(p) {
      const { error } = await supabase.from("alert_preferences").upsert(p);
      return { error };
    },
    async markAlertRead(id) {
      const { error } = await supabase.from("alerts").update({ read: true }).eq("id", id);
      return { error };
    },
    async getDisputes() {
      return select<Dispute>("disputes");
    },
    async createTransfer(args) {
      const rpc =
        args.internal
          ? await supabase.rpc("make_internal_transfer", {
              p_from: args.fromId,
              p_to: args.toId,
              p_amount: args.amountCents,
              p_schedule: args.schedule ?? "one_time",
              p_frequency: args.frequency ?? null,
              p_next_run: args.schedule === "recurring" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
              p_note: args.note ?? null,
            })
          : await supabase.rpc("make_external_transfer", {
              p_from: args.fromId,
              p_external_name: args.externalName,
              p_amount: args.amountCents,
              p_type: args.isWire ? "wire" : "external",
              p_schedule: args.schedule ?? "one_time",
              p_frequency: args.frequency ?? null,
              p_next_run: args.schedule === "recurring" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
              p_note: args.note ?? null,
              p_external_account: args.externalAccount ?? null,
            });
      return { error: rpc.error, transferId: rpc.data ?? null };
    },
    async createBillPayment({ payeeId, fromId, amountCents, schedule = "one_time", frequency = null }) {
      const { error } = await supabase.rpc("make_bill_payment", {
        p_payee: payeeId, p_from: fromId, p_amount: amountCents, p_schedule: schedule,
        p_frequency: frequency ?? null,
        p_next_run: schedule === "recurring" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
      });
      return { error };
    },
    async addPayee(p) {
      const { error } = await supabase.from("payees").insert({ name: p.name, category: p.category, phone: p.phone ?? null });
      return { error };
    },
    async createZelleTransfer({ contactId, amountCents, direction, note = null }) {
      const { error } = await supabase.rpc("make_zelle_transfer", {
        p_contact: contactId, p_amount: amountCents,
        p_direction: direction === "request" ? "received" : "sent", p_note: note ?? null,
      });
      return { error };
    },
    async addZelleContact(c) {
      const { error } = await supabase.from("zelle_contacts").insert({ name: c.name, email_or_phone: c.emailOrPhone, bank: c.bank ?? null });
      return { error };
    },
    async addDeposit({ accountId, amountCents }) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: "You must be signed on to make a deposit." } };
      }
      const { data: account } = await supabase
        .from("accounts")
        .select("restricted")
        .eq("id", accountId)
        .maybeSingle();
      if (account?.restricted) {
        return {
          error: {
            message: "This account is restricted and cannot receive deposits.",
          },
        };
      }
      const { error } = await supabase.from("transactions").insert({
        account_id: accountId,
        user_id: user.id,
        description: "Deposit",
        merchant: "Deposit",
        category: "Income",
        amount_cents: amountCents,
        status: "pending",
        posted_at: new Date().toISOString(),
        reference: "DEP-" + crypto.randomUUID().slice(0, 6),
      });
      return { error };
    },
    async setCardStatus(id, status) {
      const { error } = await supabase.rpc("set_card_status", { p_card: id, p_status: status });
      return { error };
    },
    async issueVirtualCard({ accountId, network }) {
      const { error } = await supabase.rpc("issue_virtual_card", {
        p_account: accountId,
        p_network: network,
      });
      return { error };
    },
    async deleteCard(id) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: card } = await supabase
        .from("cards")
        .select("card_last4")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (!error && user) {
        await supabase.from("alerts").insert({
          user_id: user.id,
          title: "Card deleted",
          message: `Card ending in ${card?.card_last4 ?? "••••"} was permanently deleted.`,
          severity: "info",
        });
      }
      return { error };
    },
    async fileDispute(d) {
      const { error } = await supabase.from("disputes").insert({
        transaction_ref: d.ref, amount_cents: d.amountCents, reason: d.reason,
      });
      return { error };
    },
  };
}

export function getBankApi(): Promise<BankApi> {
  if (!realApiPromise) {
    realApiPromise = Promise.resolve(makeRealApi(createClient()));
  }
  return realApiPromise;
}
