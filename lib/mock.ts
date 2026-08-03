import type {
  Account,
  AlertItem,
  AlertPreference,
  BillPayment,
  Card,
  Dispute,
  InvestmentHolding,
  Payee,
  Profile,
  Transaction,
  Transfer,
  ZelleContact,
  ZelleTransfer,
} from "@/lib/types";

export function isMockMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return true;
  return (
    url.includes("your-project-ref") ||
    key.includes("your-anon") ||
    key.includes("goes-here")
  );
}

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export interface MockDb {
  profile: Profile;
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  payees: Payee[];
  bill_payments: BillPayment[];
  zelle_contacts: ZelleContact[];
  zelle_transfers: ZelleTransfer[];
  cards: Card[];
  investment_holdings: InvestmentHolding[];
  alerts: AlertItem[];
  alert_preferences: AlertPreference;
  disputes: Dispute[];
}

export function createMockData(now = Date.now()): MockDb {
  const checking: Account = {
    id: "acc-checking",
    user_id: "demo-user",
    name: "Secure Checking",
    type: "checking",
    account_number: "4582 1902 7710 3361",
    routing_number: "314074269",
    balance_cents: 845805,
    available_cents: 845805,
    credit_limit_cents: null,
    apr: null,
    apy: 0.1,
    status: "active",
    opened_at: new Date(now - 3 * 365 * 86400000).toISOString(),
  };
  const savings: Account = {
    id: "acc-savings",
    user_id: "demo-user",
    name: "Performance First Savings",
    type: "savings",
    account_number: "4582 7711 0022 9084",
    routing_number: "314074269",
    balance_cents: 2483000,
    available_cents: 2483000,
    credit_limit_cents: null,
    apr: null,
    apy: 4.35,
    status: "active",
    opened_at: new Date(now - 6 * 365 * 86400000).toISOString(),
  };
  const credit: Account = {
    id: "acc-credit",
    user_id: "demo-user",
    name: "USAA Rewards Visa Platinum",
    type: "credit_card",
    account_number: "4797 8813 2244 9056",
    routing_number: "314074269",
    balance_cents: 214033,
    available_cents: 285967,
    credit_limit_cents: 500000,
    apr: 24.99,
    apy: null,
    status: "active",
    opened_at: new Date(now - 10 * 365 * 86400000).toISOString(),
  };
  const loan: Account = {
    id: "acc-loan",
    user_id: "demo-user",
    name: "Auto Loan",
    type: "loan",
    account_number: "4582 5511 7022 1044",
    routing_number: "314074269",
    balance_cents: 1245000,
    available_cents: 0,
    credit_limit_cents: null,
    apr: 6.24,
    apy: null,
    status: "active",
    opened_at: new Date(now - 2 * 365 * 86400000).toISOString(),
  };
  const invest: Account = {
    id: "acc-invest",
    user_id: "demo-user",
    name: "USAA Retirement Fund",
    type: "investment",
    account_number: "4582 1132 8902 4455",
    routing_number: "314074269",
    balance_cents: 6728000,
    available_cents: 0,
    credit_limit_cents: null,
    apr: null,
    apy: null,
    status: "active",
    opened_at: new Date(now - 8 * 365 * 86400000).toISOString(),
  };
  const accounts = [checking, savings, credit, loan, invest];

  const tx = (
    account: string,
    n: number,
    description: string,
    merchant: string | null,
    category: string,
    amount: number,
    status: "posted" | "pending" = "posted",
    reference = uid("tx"),
  ): Transaction => ({
    id: uid("tx"),
    account_id: account,
    user_id: "demo-user",
    description,
    merchant,
    category,
    amount_cents: amount,
    status,
    posted_at: daysAgo(n),
    reference,
  });

  const transactions: Transaction[] = [
    tx(checking.id, 0, "Taco Bell", "Taco Bell", "Dining", -1250),
    tx(checking.id, 0.25, "United Airlines", "United", "Travel", -28750, "pending"),
    tx(checking.id, 14, "Automated Payroll Deposit", "Microsoft", "Income", 642000),
    tx(checking.id, 14, "Transfer from Savings", "USAA Transfer", "Transfer", 100000),
    tx(credit.id, 1, "Whole Foods Market", "Whole Foods", "Groceries", -6200),
    tx(credit.id, 2, "Costco Wholesale", "Costco", "Groceries", -14020),
    tx(credit.id, 3, "Shell Gas Station", "Shell", "Fuel", -3900),
    tx(credit.id, 4, "Netflix", "Netflix", "Entertainment", -1599),
    tx(credit.id, 5, "Amazon", "Amazon", "Shopping", -8940),
    tx(credit.id, 8, "Delta Air Lines", "Delta", "Travel", -41500),
    tx(credit.id, 10, "Preferred Rewards cashback", "USAA", "Rewards", 12500),
    tx(credit.id, 12, "CVS Pharmacy", "CVS", "Health", -2380),
    tx(loan.id, 11, "Monthly vehicle payment", "USAA Auto Loan", "Loan", -145000),
  ];

  const payees: Payee[] = [
    { id: uid("pay"), user_id: "demo-user", name: "City Power & Electric", category: "Utilities", account_last4: "8812", routing_last4: "0283", phone: "800-555-0142", address: "PO Box 5123, San Antonio, TX", created_at: daysAgo(200) },
    { id: uid("pay"), user_id: "demo-user", name: "Verizon Wireless", category: "Telephone", account_last4: "3310", routing_last4: "1840", phone: "800-555-0177", address: "PO Box 9000, Dallas, TX", created_at: daysAgo(180) },
    { id: uid("pay"), user_id: "demo-user", name: "Sunstate Insurance Co.", category: "Insurance", account_last4: "7745", routing_last4: "3290", phone: "800-555-0104", address: "1400 Market St, San Francisco, CA", created_at: daysAgo(150) },
    { id: uid("pay"), user_id: "demo-user", name: "Homeowners Association", category: "Housing", account_last4: "2021", routing_last4: "5510", phone: "800-555-0128", address: "500 Oak Creek Rd, Austin, TX", created_at: daysAgo(120) },
  ];

  const bill_payments: BillPayment[] = [
    { id: uid("bp"), user_id: "demo-user", payee_id: payees[1].id, from_account_id: checking.id, amount_cents: 8900, schedule: "recurring", frequency: "monthly", next_run: daysAhead(8), status: "scheduled", created_at: daysAgo(10) },
    { id: uid("bp"), user_id: "demo-user", payee_id: payees[0].id, from_account_id: checking.id, amount_cents: 13450, schedule: "one_time", frequency: null, next_run: null, status: "completed", created_at: daysAgo(6) },
    { id: uid("bp"), user_id: "demo-user", payee_id: payees[2].id, from_account_id: checking.id, amount_cents: 15700, schedule: "recurring", frequency: "monthly", next_run: daysAhead(20), status: "scheduled", created_at: daysAgo(12) },
  ];

  const zelle_contacts: ZelleContact[] = [
    { id: uid("zc"), user_id: "demo-user", name: "Alex Morgan", email_or_phone: "alex.morgan@example.com", bank: "Chase", created_at: daysAgo(60) },
    { id: uid("zc"), user_id: "demo-user", name: "Priya Patel", email_or_phone: "512-555-0143", bank: "Bank of America", created_at: daysAgo(55) },
    { id: uid("zc"), user_id: "demo-user", name: "Marcus Reed", email_or_phone: "marcus.reed@example.com", bank: "Wells Fargo", created_at: daysAgo(50) },
  ];

  const zelle_transfers: ZelleTransfer[] = [
    { id: uid("zt"), user_id: "demo-user", direction: "sent", contact_id: zelle_contacts[0].id, amount_cents: 25000, status: "completed", note: "Dinner & movie", created_at: daysAgo(2) },
    { id: uid("zt"), user_id: "demo-user", direction: "received", contact_id: zelle_contacts[1].id, amount_cents: 18000, status: "completed", note: "Split utilities", created_at: daysAgo(5) },
    { id: uid("zt"), user_id: "demo-user", direction: "sent", contact_id: zelle_contacts[2].id, amount_cents: 4000, status: "completed", note: "Coffee", created_at: daysAgo(9) },
  ];

  const cards: Card[] = [
    { id: uid("card"), user_id: "demo-user", account_id: checking.id, card_last4: "7931", brand: "Visa", card_type: "debit", status: "active", expires: "07/29" },
    { id: uid("card"), user_id: "demo-user", account_id: credit.id, card_last4: "2210", brand: "Visa", card_type: "credit", status: "active", expires: "09/30" },
  ];

  const investment_holdings: InvestmentHolding[] = [
    { id: uid("h"), account_id: invest.id, user_id: "demo-user", symbol: "VTSAX", name: "Vanguard Total Stock Market Index", shares: 120.5, avg_cost_cents: 10149, current_price_cents: 10420 },
    { id: uid("h"), account_id: invest.id, user_id: "demo-user", symbol: "VXUS", name: "Vanguard Total International Stock", shares: 220.1, avg_cost_cents: 4120, current_price_cents: 4155 },
    { id: uid("h"), account_id: invest.id, user_id: "demo-user", symbol: "BND", name: "Vanguard Total Bond Market", shares: 150, avg_cost_cents: 7400, current_price_cents: 7550 },
  ];

  const alerts: AlertItem[] = [
    { id: uid("al"), user_id: "demo-user", title: "Direct deposit received", message: "Your payroll deposit of $6,420.00 posted to Secure Checking", severity: "success", read: true, created_at: daysAgo(1) },
    { id: uid("al"), user_id: "demo-user", title: "Low balance alert", message: "Secure Checking dropped below your $500.00 threshold.", severity: "warning", read: false, created_at: daysAgo(3) },
    { id: uid("al"), user_id: "demo-user", title: "Welcome to your demo account", message: "You are in a demonstration environment. Account data is sample data.", severity: "info", read: false, created_at: daysAgo(0) },
  ];

  return {
    profile: {
      id: uid("prof"),
      user_id: "demo-user",
      first_name: "Alex",
      last_name: "Reed",
      phone: "(210) 555-0134",
      address_line1: "123 Alamo Heights",
      city: "San Antonio",
      state: "TX",
      zip: "78209",
      date_of_birth: "1990-04-12",
      ssn_last4: "2231",
      military_branch: "Army",
      member_since: daysAgo(1825),
    },
    accounts,
    transactions,
    transfers: [],
    payees,
    bill_payments,
    zelle_contacts,
    zelle_transfers,
    cards,
    investment_holdings,
    alerts,
    alert_preferences: {
      id: uid("ap"),
      user_id: "demo-user",
      low_balance: true,
      large_transaction: true,
      login_activity: true,
      bill_due: true,
      credit_report: false,
      email_me: false,
      push_me: true,
    },
    disputes: [],
  };
}