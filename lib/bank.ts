import { isMockMode } from "@/lib/mock";
import { getDb, mutate, freshId } from "@/lib/mock-store";
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
  isMock: boolean;
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
  getAlertPrefs(): Promise<AlertPreference | null>;
  setAlertPrefs(p: Partial<AlertPreference>): Promise<OpResult>;
  markAlertRead(id: string): Promise<OpResult>;
  getDisputes(): Promise<Dispute[]>;
  createTransfer(args: {
    internal: boolean;
    fromId: string;
    toId?: string;
    externalName?: string;
    amountCents: number;
    schedule?: string;
    frequency?: string | null;
    note?: string | null;
    isWire?: boolean;
  }): Promise<OpResult>;
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
  makeDeposit(args: { accountId: string; amountCents: number }): Promise<OpResult>;
  setCardStatus(id: string, status: string): Promise<OpResult>;
  fileDispute(d: { ref: string; amountCents: number; reason: string }): Promise<OpResult>;
  resetDemo(): Promise<void>;
}

type BankDb = ReturnType<typeof import("@/lib/mock").createMockData>;

const mockApi: BankApi = {
  isMock: true,

  async getProfile() {
    return getDb().profile;
  },
  async updateProfile(p) {
    try {
      mutate((db) => {
        db.profile = { ...db.profile, ...p };
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },
  async getAccounts() {
    return getDb().accounts;
  },
  async getAccount(id) {
    return getDb().accounts.find((a) => a.id === id) ?? null;
  },
  async getTransactions(limit = 500) {
    return [...getDb().transactions]
      .sort((a, b) => b.posted_at.localeCompare(a.posted_at))
      .slice(0, limit);
  },
  async getTransactionsByAccount(accountId) {
    return [...getDb().transactions]
      .filter((t) => t.account_id === accountId)
      .sort((a, b) => b.posted_at.localeCompare(a.posted_at));
  },
  async getTransfers() {
    return getDb().transfers;
  },
  async getPayees() {
    return getDb().payees;
  },
  async getPayments() {
    return getDb().bill_payments;
  },
  async getZelleContacts() {
    return getDb().zelle_contacts;
  },
  async getZelleTransfers() {
    return getDb().zelle_transfers;
  },
  async getCards() {
    return getDb().cards;
  },
  async getCardsByAccount(accountId) {
    return getDb().cards.filter((c) => c.account_id === accountId);
  },
  async getHoldings() {
    return getDb().investment_holdings;
  },
  async getAlerts() {
    return getDb().alerts;
  },
  async getAlertPrefs() {
    return getDb().alert_preferences;
  },
  async setAlertPrefs(p) {
    try {
      mutate((db) => {
        db.alert_preferences = { ...db.alert_preferences, ...p };
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },
  async markAlertRead(id) {
    try {
      mutate((db) => {
        const a = db.alerts.find((x) => x.id === id);
        if (a) a.read = true;
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },
  async getDisputes() {
    return getDb().disputes;
  },

  async createTransfer(args) {
    const cents = args.amountCents;
    if (!cents || cents <= 0) return { error: { message: "Enter a valid amount." } };
    try {
      mutate((db) => {
        if (args.internal) {
          if (!args.toId) throw new Error("Select a destination account.");
          debit(db, args.fromId, cents);
          const dest = db.accounts.find((a) => a.id === args.toId);
          if (!dest) {
            debit(db, args.fromId, -cents);
            throw new Error("Destination account not found.");
          }
          dest.balance_cents += cents;
          dest.available_cents += cents;
          const toName = dest.name;
          makeTx(db, args.fromId, `Transfer to ${toName}`, "Transfer", -cents);
          db.transfers.push(transferRow(db, {
            fromId: args.fromId, toId: args.toId, amount: cents,
            schedule: args.schedule, frequency: args.frequency, note: args.note, type: "internal",
          }));
        } else {
          debit(db, args.fromId, cents);
          const label = args.externalName ?? "External";
          makeTx(db, args.fromId, `Transfer to ${label}`, "Transfer", -cents);
          db.transfers.push(transferRow(db, {
            fromId: args.fromId, externalName: args.externalName, amount: cents,
            schedule: args.schedule, frequency: args.frequency, note: args.note, type: args.isWire ? "wire" : "external",
          }));
        }
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async createBillPayment({ payeeId, fromId, amountCents, schedule = "one_time", frequency = null }) {
    if (!amountCents || amountCents <= 0) return { error: { message: "Enter a valid amount." } };
    try {
      mutate((db) => {
        const payee = db.payees.find((p) => p.id === payeeId);
        if (!payee) throw new Error("Payee not found.");
        if (schedule === "recurring") {
          db.bill_payments.unshift({
            id: freshId("bp"), user_id: "demo-user", payee_id: payeeId, from_account_id: fromId,
            amount_cents: amountCents, schedule: "recurring", frequency, next_run: nextMonth(), status: "scheduled",
            created_at: new Date().toISOString(),
          });
        } else {
          debit(db, fromId, amountCents);
          db.bill_payments.unshift({
            id: freshId("bp"), user_id: "demo-user", payee_id: payeeId, from_account_id: fromId,
            amount_cents: amountCents, schedule: "one_time", frequency: null, next_run: null, status: "completed",
            created_at: new Date().toISOString(),
          });
          makeTx(db, fromId, `Bill payment to ${payee.name}`, "Bill Pay", -amountCents);
        }
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async addPayee({ name, category, phone = null }) {
    try {
      mutate((db) => {
        db.payees.unshift({
          id: freshId("pay"), user_id: "demo-user", name, category, account_last4: null,
          routing_last4: null, phone, address: null, created_at: new Date().toISOString(),
        });
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async createZelleTransfer({ contactId, amountCents, direction, note = null }) {
    if (!amountCents || amountCents <= 0) return { error: { message: "Enter an amount." } };
    try {
      mutate((db) => {
        const contact = db.zelle_contacts.find((c) => c.id === contactId);
        if (!contact) throw new Error("Contact not found.");
        const dir = direction === "request" ? "received" : "sent";
        if (dir === "sent") {
          const checking = db.accounts.find((a) => a.type === "checking");
          if (!checking) throw new Error("No checking account available.");
          debit(db, checking.id, amountCents);
          makeTx(db, checking.id, `Zelle payment to ${contact.name}`, "Zelle", -amountCents);
        }
        db.zelle_transfers.unshift({
          id: freshId("zt"), user_id: "demo-user", direction: dir, contact_id: contactId,
          amount_cents: amountCents, status: "completed", note: note ?? contact.name,
          created_at: new Date().toISOString(),
        });
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async addZelleContact({ name, emailOrPhone, bank = null }) {
    try {
      mutate((db) => {
        db.zelle_contacts.unshift({
          id: freshId("zc"), user_id: "demo-user", name, email_or_phone: emailOrPhone,
          bank, created_at: new Date().toISOString(),
        });
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async makeDeposit({ accountId, amountCents }) {
    if (!amountCents || amountCents <= 0) return { error: { message: "Enter a valid amount." } };
    try {
      mutate((db) => {
        credit(db, accountId, amountCents);
        makeTx(db, accountId, "Mobile check deposit", "Income", amountCents);
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async setCardStatus(id, status) {
    try {
      mutate((db) => {
        const c = db.cards.find((x) => x.id === id);
        if (c) c.status = status as Card["status"];
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async fileDispute({ ref, amountCents, reason }) {
    try {
      mutate((db) => {
        db.disputes.unshift({
          id: freshId("dp"), user_id: "demo-user", transaction_ref: ref,
          amount_cents: amountCents, reason, status: "submitted", created_at: new Date().toISOString(),
        });
      });
      return { error: null };
    } catch (e) {
      return typeOfErr(e);
    }
  },

  async resetDemo() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("usaa_mock_db_v1");
    }
  },
};

function typeOfErr(e: unknown): OpResult {
  return e instanceof Error ? { error: { message: e.message } } : { error: { message: "Operation failed." } };
}

const nextMonth = () => new Date(Date.now() + 30 * 86400000).toISOString();

function transferRow(
  db: BankDb,
  args: {
    fromId: string;
    toId?: string;
    externalName?: string | null;
    amount: number;
    schedule?: string;
    frequency?: string | null;
    note?: string | null;
    type?: string;
  },
): Transfer {
  return {
    id: freshId("tf"),
    user_id: "demo-user",
    from_account_id: args.fromId,
    to_account_id: args.toId ?? null,
    external_name: args.externalName ?? null,
    amount_cents: args.amount,
    transfer_type: (args.type ?? "internal") as Transfer["transfer_type"],
    schedule: (args.schedule ?? "one_time") as Transfer["schedule"],
    frequency: args.frequency ?? null,
    next_run: args.schedule === "recurring" ? nextMonth() : null,
    status: "completed",
    note: args.note ?? null,
    created_at: new Date().toISOString(),
  };
}

const makeTx = (db: BankDb, accountId: string, description: string, category: string, amount: number) => {
  const tx: Transaction = {
    id: freshId("tx"),
    account_id: accountId,
    user_id: "demo-user",
    description,
    merchant: null,
    category,
    amount_cents: amount,
    status: "posted",
    posted_at: new Date().toISOString(),
    reference: "REF-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
  db.transactions.unshift(tx);
  return tx;
};

const debit = (db: BankDb, accountId: string, cents: number) => {
  const a = db.accounts.find((x) => x.id === accountId);
  if (!a) throw new Error("Account not found.");
  if (a.type !== "credit_card" && a.available_cents < cents) {
    throw new Error("Insufficient funds.");
  }
  a.available_cents -= cents;
  if (a.type !== "credit_card") a.balance_cents -= cents;
};

const credit = (db: BankDb, accountId: string, cents: number) => {
  const a = db.accounts.find((x) => x.id === accountId);
  if (!a) throw new Error("Destination account not found.");
  a.balance_cents += cents;
  a.available_cents += cents;
};

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
    isMock: false,
    async getProfile() {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return (data ?? null) as Profile | null;
    },
    async updateProfile(p) {
      const { error } = await supabase.from("profiles").update(p).eq("user_id", p.id ?? "");
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
            });
      return { error: rpc.error };
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
    async makeDeposit({ accountId, amountCents }) {
      const { error } = await supabase.from("transactions").insert({
        account_id: accountId, description: "Mobile check deposit", merchant: "Mobile Deposit",
        category: "Income", amount_cents: amountCents, status: "pending",
        posted_at: new Date().toISOString(), reference: "DEP-" + Date.now().toString().slice(-6),
      });
      return { error };
    },
    async setCardStatus(id, status) {
      const { error } = await supabase.rpc("set_card_status", { p_card: id, p_status: status });
      return { error };
    },
    async fileDispute(d) {
      const { error } = await supabase.from("disputes").insert({
        transaction_ref: d.ref, amount_cents: d.amountCents, reason: d.reason,
      });
      return { error };
    },
    async resetDemo() {
      await supabase.rpc("reset_demo_data");
    },
  };
}

export function getBankApi(): Promise<BankApi> {
  if (isMockMode()) {
    return Promise.resolve(mockApi);
  }
  if (!realApiPromise) {
    realApiPromise = Promise.resolve(makeRealApi(createClient()));
  }
  return realApiPromise;
}