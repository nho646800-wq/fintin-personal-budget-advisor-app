import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DashboardData = {
  moneyOnHand: number;
  goalPurpose: string | null;
  goalTargetAmount: number;
  goalDeadline: string | null;
  daysRemaining: number;
  savingsPercent: number;
  needsTotal: number;
  wantsTotal: number;
  from: string;
  to: string;
};

type ExpenseRow = {
  amount: number | string | null;
  main_category: string | null;
  logged_at: string | null;
};

type AmountRow = {
  amount: number | string | null;
};

/** Calendar day of an instant, as YYYY-MM-DD in UTC. */
export function utcCalendarDay(timestamp: string): string | null {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function currentUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function isIsoDate(value: string | undefined): value is string {
  return typeof value === "string" && parseIsoDate(value) !== null;
}

/** Whole calendar days from today until the deadline. Never negative. */
export function daysRemainingUntil(
  today: string,
  deadline: string | null
): number {
  if (!deadline) return 0;
  const start = parseIsoDate(today);
  const end = parseIsoDate(deadline);
  if (!start || !end) return 0;

  const ms =
    Date.UTC(end.year, end.month - 1, end.day) -
    Date.UTC(start.year, start.month - 1, start.day);

  return Math.max(0, Math.round(ms / 86_400_000));
}

function toCents(amount: number | string | null | undefined): number {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** opening_balance + every income amount − every expense amount. Not stored. */
export function computeMoneyOnHand(
  openingBalance: number | string | null | undefined,
  incomeAmounts: Array<number | string | null | undefined>,
  expenseAmounts: Array<number | string | null | undefined>
): number {
  const incomeCents = incomeAmounts.reduce<number>(
    (total, amount) => total + toCents(amount),
    0
  );
  const expenseCents = expenseAmounts.reduce<number>(
    (total, amount) => total + toCents(amount),
    0
  );
  return (toCents(openingBalance) + incomeCents - expenseCents) / 100;
}

/**
 * Needs and Wants only, and only rows whose logged day falls in [from, to].
 * Savings is not an expense category and is not computed here.
 */
export function expenseTotalsInRange(
  rows: ExpenseRow[],
  from: string,
  to: string
): { needs: number; wants: number } {
  let needsCents = 0;
  let wantsCents = 0;

  for (const row of rows) {
    if (!row.logged_at) continue;
    const day = utcCalendarDay(row.logged_at);
    if (!day || day < from || day > to) continue;

    const cents = toCents(row.amount);
    const category = row.main_category?.trim().toLowerCase();
    if (category === "needs") needsCents += cents;
    else if (category === "wants") wantsCents += cents;
  }

  return { needs: needsCents / 100, wants: wantsCents / 100 };
}

export function savingsProgressPercent(
  moneyOnHand: number,
  goalTargetAmount: number
): number {
  if (!(goalTargetAmount > 0)) return 0;
  return Math.max(0, Math.round((moneyOnHand / goalTargetAmount) * 100));
}

export function resolveDateRange(
  today: string,
  requestedFrom: string | undefined,
  requestedTo: string | undefined
): { from: string; to: string } {
  const from = isIsoDate(requestedFrom) ? requestedFrom : firstOfMonth(today);
  const to = isIsoDate(requestedTo) ? requestedTo : today;
  if (from <= to) return { from, to };
  return { from: to, to: from };
}

export async function getDashboardData(options: {
  from?: string;
  to?: string;
}): Promise<DashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to view the dashboard.");
  }

  const today = currentUtcDate();
  const range = resolveDateRange(today, options.from, options.to);

  const [userResult, incomeResult, expenseResult] = await Promise.all([
    supabase
      .from("users")
      .select(
        "opening_balance, goal_purpose, goal_target_amount, goal_deadline"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("income_entries")
      .select("amount")
      .eq("user_id", user.id),
    supabase
      .from("expenses")
      .select("amount, main_category, logged_at")
      .eq("user_id", user.id),
  ]);

  if (userResult.error) throw new Error(userResult.error.message);
  if (incomeResult.error) throw new Error(incomeResult.error.message);
  if (expenseResult.error) throw new Error(expenseResult.error.message);

  const openingBalance = userResult.data?.opening_balance ?? 0;
  const incomeRows = (incomeResult.data ?? []) as AmountRow[];
  const expenseRows = (expenseResult.data ?? []) as ExpenseRow[];

  const balance = computeMoneyOnHand(
    openingBalance,
    incomeRows.map((row) => row.amount),
    expenseRows.map((row) => row.amount)
  );

  const { needs, wants } = expenseTotalsInRange(
    expenseRows,
    range.from,
    range.to
  );

  const goalTargetAmount = Number(userResult.data?.goal_target_amount ?? 0);
  const goalDeadline = userResult.data?.goal_deadline ?? null;

  return {
    moneyOnHand: balance,
    goalPurpose: userResult.data?.goal_purpose ?? null,
    goalTargetAmount: Number.isFinite(goalTargetAmount) ? goalTargetAmount : 0,
    goalDeadline,
    daysRemaining: daysRemainingUntil(today, goalDeadline),
    savingsPercent: savingsProgressPercent(
      balance,
      Number.isFinite(goalTargetAmount) ? goalTargetAmount : 0
    ),
    needsTotal: needs,
    wantsTotal: wants,
    from: range.from,
    to: range.to,
  };
}
