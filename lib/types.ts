export type AccountType = "checking" | "savings" | "credit_card" | "loan" | "investment";

export type AccountStatus = "active" | "closed";

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  date_of_birth: string | null;
  ssn_last4: string | null;
  member_since: string;
  military_branch: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  account_number: string;
  routing_number: string;
  balance_cents: number;
  available_cents: number;
  credit_limit_cents: number | null;
  apr: number | null;
  apy: number | null;
  status: AccountStatus;
  opened_at: string;
  created_at: string;
  restricted: boolean;
  restriction_reason: string | null;
  restriction_until: string | null;
}

export interface Transaction {
  id: string;
  account_id: string;
  user_id: string;
  description: string;
  merchant: string | null;
  category: string;
  amount_cents: number;
  status: "posted" | "pending";
  posted_at: string;
  reference: string | null;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  external_name: string | null;
  external_account: string | null;
  amount_cents: number;
  transfer_type: "internal" | "external" | "wire" | "zelle";
  schedule: "one_time" | "recurring";
  frequency: string | null;
  next_run: string | null;
  status: "scheduled" | "completed" | "failed";
  note: string | null;
  created_at: string;
}

export interface Payee {
  id: string;
  user_id: string;
  name: string;
  category: string;
  account_last4: string | null;
  routing_last4: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface BillPayment {
  id: string;
  user_id: string;
  payee_id: string;
  from_account_id: string;
  amount_cents: number;
  schedule: "one_time" | "recurring";
  frequency: string | null;
  next_run: string | null;
  status: "scheduled" | "completed" | "failed" | "cancelled";
  created_at: string;
}

export interface ZelleContact {
  id: string;
  user_id: string;
  name: string;
  email_or_phone: string;
  bank: string | null;
  created_at: string;
}

export interface ZelleTransfer {
  id: string;
  user_id: string;
  direction: "sent" | "received";
  contact_id: string | null;
  amount_cents: number;
  status: "pending" | "completed" | "failed";
  note: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  account_id: string;
  card_last4: string;
  brand: string;
  card_type: "debit" | "credit" | "virtual";
  status: "active" | "locked" | "lost" | "stolen" | "frozen";
  expires: string;
  card_number?: string | null;
  cvv?: string | null;
}

export interface InvestmentHolding {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  name: string;
  shares: number;
  avg_cost_cents: number;
  current_price_cents: number;
}

export interface AlertPreference {
  id: string;
  user_id: string;
  low_balance: boolean;
  large_transaction: boolean;
  login_activity: boolean;
  bill_due: boolean;
  credit_report: boolean;
  email_me: boolean;
  push_me: boolean;
}

export interface AlertItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "critical";
  read: boolean;
  created_at: string;
}

export interface Dispute {
  id: string;
  user_id: string;
  transaction_ref: string;
  amount_cents: number;
  reason: string;
  status: "submitted" | "in_review" | "resolved";
  created_at: string;
}

export interface AppSettings {
  id: number;
  maintenance_mode: boolean;
  tawk_enabled: boolean;
  tawk_property_id: string | null;
  tawk_widget_id: string | null;
  tawk_full_link: string | null;
  updated_at: string;
}

export interface AdminStats {
  total_accounts: number;
  restricted_count: number;
  maintenance_mode: boolean;
  tawk_enabled: boolean;
}

export interface AdminAccountRow {
  account_id: string;
  user_id: string;
  member_name: string;
  email: string;
  account_name: string;
  account_type: string;
  account_number: string;
  routing_number: string;
  balance_cents: number;
  available_cents: number;
  restricted: boolean;
  created_at: string;
  member_since: string;
}