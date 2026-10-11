import { formatCurrencyDisplay } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Timing is a fixed 3-option dropdown set during onboarding Step 2. These
// three exact strings are the only valid values — the onboarding form's
// <select> option values must match them character-for-character (including
// capitalization) or normalizeToMonthlyCents below will throw instead of
// silently guessing wrong.
// ---------------------------------------------------------------------------
export type IncomeTiming = "Weekly" | "Bi-weekly" | "Monthly";

export type OnboardingIncomeEntry = {
  source: string;
  amount: number;
  timing: IncomeTiming;
};

/**
 * Four, not 52/12 (4.3333). A student budgets against the paydays they can
 * count on every single month, and every month contains at least four weeks.
 * Using 4.3333 bakes a partial fifth payday into every month's allocation —
 * money that only actually arrives in some months — which makes the monthly
 * and weekly figures irreconcilable to anyone doing the arithmetic by hand.
 * With 4, weekly x 4 returns the monthly figure exactly, and a month that
 * happens to contain a fifth payday is an unbudgeted bonus.
 */
const WEEKS_PER_MONTH = 4;

const MONTHLY_MULTIPLIER: Record<IncomeTiming, number> = {
  Weekly: WEEKS_PER_MONTH,
  "Bi-weekly": WEEKS_PER_MONTH / 2,
  Monthly: 1,
};

const NEEDS_SHARE = 0.5;
const SAVINGS_SHARE = 0.2;

export type PlanCase = "FUNDED" | "A" | "B" | "C";

export interface Allocation {
  needs: number;
  wants: number;
  savings: number;
}

export interface PlanInput {
  openingBalance: number;
  incomeEntries: OnboardingIncomeEntry[];
  goalPurpose: string;
  goalTargetAmount: number;
  /** "YYYY-MM-DD" */
  goalDeadline: string;
  city: string;
  state: string;
  /** "YYYY-MM-DD" */
  today: string;
}

export interface PlanCalculation {
  planCase: PlanCase;
  openingBalance: number;
  goalPurpose: string;
  goalTargetAmount: number;
  goalDeadline: string;
  city: string;
  state: string;
  incomeEntries: OnboardingIncomeEntry[];
  monthlyIncome: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
  /** The textbook 50/30/20 split of monthly income, always populated. */
  baseline: Allocation;
  /**
   * The allocation the user should actually follow. Null only in Case C,
   * where no split of their income can reach the goal, so recommending
   * per-bucket dollar amounts would be meaningless.
   */
  monthly: Allocation | null;
  /** monthly / 4. Null whenever `monthly` is null. */
  weekly: Allocation | null;
  /** True when funding the goal pushed Needs under the 50% baseline. */
  needsBelowBaseline: boolean;
  /** Case C only: the monthly gap that income cannot cover. */
  shortfall: number;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

function normalizeToMonthlyCents(
  amountCents: number,
  timing: IncomeTiming
): number {
  const multiplier = MONTHLY_MULTIPLIER[timing];

  if (multiplier === undefined) {
    // The onboarding form is sending a value outside the three-option
    // dropdown — fix the form, don't widen this lookup.
    throw new Error(`Unhandled income timing: ${timing}`);
  }

  return Math.round(amountCents * multiplier);
}

function parseIsoDateParts(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${iso}".`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * Whole months between two calendar dates, read straight from the date
 * strings. Going through `new Date(iso)` instead would parse as UTC midnight
 * and then be read back with local getters, shifting the day backwards in
 * every negative UTC offset and occasionally landing in the wrong month.
 */
function monthsUntil(today: string, deadline: string): number {
  const start = parseIsoDateParts(today);
  const end = parseIsoDateParts(deadline);

  let months = (end.year - start.year) * 12 + (end.month - start.month);
  if (end.day < start.day) months -= 1;

  return Math.max(1, months);
}

/**
 * Splits monthly income into 50/30/20. Needs and Savings are rounded, then
 * Wants takes the remainder, so the three buckets always sum to exactly the
 * income figure rather than drifting a cent apart from independent rounding.
 */
function splitBaseline(monthlyIncomeCents: number): {
  needs: number;
  wants: number;
  savings: number;
} {
  const needs = Math.round(monthlyIncomeCents * NEEDS_SHARE);
  const savings = Math.round(monthlyIncomeCents * SAVINGS_SHARE);

  return { needs, wants: monthlyIncomeCents - needs - savings, savings };
}

export function calculateInitialPlan(input: PlanInput): PlanCalculation {
  const monthlyIncomeCents = input.incomeEntries.reduce(
    (sum, entry) =>
      sum + normalizeToMonthlyCents(toCents(entry.amount), entry.timing),
    0
  );

  const openingBalanceCents = toCents(input.openingBalance);
  const goalTargetCents = toCents(input.goalTargetAmount);
  const monthsRemaining = monthsUntil(input.today, input.goalDeadline);

  const baselineCents = splitBaseline(monthlyIncomeCents);
  const baseline: Allocation = {
    needs: fromCents(baselineCents.needs),
    wants: fromCents(baselineCents.wants),
    savings: fromCents(baselineCents.savings),
  };

  const weeklyOf = (allocation: {
    needs: number;
    wants: number;
    savings: number;
  }): Allocation => ({
    needs: fromCents(Math.round(allocation.needs / WEEKS_PER_MONTH)),
    wants: fromCents(Math.round(allocation.wants / WEEKS_PER_MONTH)),
    savings: fromCents(Math.round(allocation.savings / WEEKS_PER_MONTH)),
  });

  const shared = {
    openingBalance: input.openingBalance,
    goalPurpose: input.goalPurpose,
    goalTargetAmount: input.goalTargetAmount,
    goalDeadline: input.goalDeadline,
    city: input.city,
    state: input.state,
    incomeEntries: input.incomeEntries,
    monthlyIncome: fromCents(monthlyIncomeCents),
    monthsRemaining,
    baseline,
  };

  const gapCents = goalTargetCents - openingBalanceCents;

  if (gapCents <= 0) {
    return {
      ...shared,
      planCase: "FUNDED",
      requiredMonthlySavings: 0,
      monthly: baseline,
      weekly: weeklyOf(baselineCents),
      needsBelowBaseline: false,
      shortfall: 0,
    };
  }

  // Ceil rather than round: rounding down would leave the user a few cents
  // short of the target on the deadline month.
  const requiredCents = Math.ceil(gapCents / monthsRemaining);

  if (requiredCents <= baselineCents.savings) {
    return {
      ...shared,
      planCase: "A",
      requiredMonthlySavings: fromCents(requiredCents),
      monthly: baseline,
      weekly: weeklyOf(baselineCents),
      needsBelowBaseline: false,
      shortfall: 0,
    };
  }

  if (requiredCents > monthlyIncomeCents) {
    return {
      ...shared,
      planCase: "C",
      requiredMonthlySavings: fromCents(requiredCents),
      monthly: null,
      weekly: null,
      needsBelowBaseline: false,
      shortfall: fromCents(requiredCents - monthlyIncomeCents),
    };
  }

  // Needs-first: savings is fixed by the goal, then Needs is funded up to its
  // 50% baseline before Wants gets anything. Wants is the discretionary
  // bucket, so it absorbs the squeeze first and Needs is cut only once Wants
  // is already at zero.
  const savings = requiredCents;
  const remaining = monthlyIncomeCents - savings;
  const needs = Math.min(baselineCents.needs, remaining);
  const adjustedCents = { needs, wants: remaining - needs, savings };

  return {
    ...shared,
    planCase: "B",
    requiredMonthlySavings: fromCents(requiredCents),
    monthly: {
      needs: fromCents(adjustedCents.needs),
      wants: fromCents(adjustedCents.wants),
      savings: fromCents(adjustedCents.savings),
    },
    weekly: weeklyOf(adjustedCents),
    needsBelowBaseline: needs < baselineCents.needs,
    shortfall: 0,
  };
}

function formatPercent(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

function renderIncomeBreakdown(calc: PlanCalculation): string {
  const lines = calc.incomeEntries.map((entry) => {
    const monthly = fromCents(
      normalizeToMonthlyCents(toCents(entry.amount), entry.timing)
    );
    const perMonth =
      entry.timing === "Monthly"
        ? ""
        : ` (${formatCurrencyDisplay(monthly)} per month)`;

    return `- ${entry.source}: ${formatCurrencyDisplay(entry.amount)} ${entry.timing}${perMonth}`;
  });

  return [
    `Expected monthly income: ${formatCurrencyDisplay(calc.monthlyIncome)}`,
    ...lines,
  ].join("\n");
}

function renderAllocation(calc: PlanCalculation): string {
  if (!calc.monthly || !calc.weekly) return "";

  const { monthly, weekly, monthlyIncome } = calc;

  return `Monthly Allocation:
- Needs (${formatPercent(monthly.needs, monthlyIncome)}): ${formatCurrencyDisplay(monthly.needs)}
- Wants (${formatPercent(monthly.wants, monthlyIncome)}): ${formatCurrencyDisplay(monthly.wants)}
- Savings (${formatPercent(monthly.savings, monthlyIncome)}): ${formatCurrencyDisplay(monthly.savings)}

Weekly Allocation:
- Needs: ${formatCurrencyDisplay(weekly.needs)} per week
- Wants: ${formatCurrencyDisplay(weekly.wants)} per week
- Savings: ${formatCurrencyDisplay(weekly.savings)} per week`;
}

function renderGoalSection(calc: PlanCalculation): string {
  const {
    planCase,
    goalPurpose,
    goalTargetAmount,
    goalDeadline,
    monthsRemaining,
    requiredMonthlySavings,
    openingBalance,
    monthlyIncome,
    baseline,
    monthly,
    shortfall,
  } = calc;

  if (planCase === "FUNDED") {
    return `Your current ${formatCurrencyDisplay(openingBalance)} on hand already meets your ${formatCurrencyDisplay(goalTargetAmount)} ${goalPurpose} goal — you do not need to save anything further to reach it by ${goalDeadline}. The split above keeps you steady from here.`;
  }

  const requirement = `To reach your ${goalPurpose} goal of ${formatCurrencyDisplay(goalTargetAmount)} by ${goalDeadline}, you need to save ${formatCurrencyDisplay(requiredMonthlySavings)} per month — that is the ${formatCurrencyDisplay(goalTargetAmount - openingBalance)} still to go, spread across the ${monthsRemaining} months remaining.`;

  if (planCase === "A") {
    return `${requirement} That fits inside the standard 20% savings share (${formatCurrencyDisplay(baseline.savings)}), so the 50/30/20 split above works as-is.`;
  }

  if (planCase === "C") {
    return `${requirement}

**Your Income May Not Be Enough to Hit This Deadline**

That is more than your entire ${formatCurrencyDisplay(monthlyIncome)} monthly income. Even putting every dollar you take in toward savings, you would still fall short by ${formatCurrencyDisplay(shortfall)} per month. Because no split of ${formatCurrencyDisplay(monthlyIncome)} can reach ${formatCurrencyDisplay(requiredMonthlySavings)}, this plan does not assign Needs, Wants, and Savings amounts yet.

To close the gap:
- Increase your income: look into a part-time or on-campus job, work-study position, or internship. Check your school's career center or student employment office, and platforms like Handshake, Indeed, or LinkedIn Jobs.
- Give the goal more room: a later deadline or a smaller target both bring the monthly number down.
- Once you start logging real expenses, your weekly advice reports will point to specific categories to trim.

This projection uses only what you entered today — any income you did not report would change it.`;
  }

  // Case B: the goal overrides the textbook split, so spell out exactly how
  // the numbers above were derived instead of leaving them unexplained.
  const explanation = `${requirement}

**Why This Isn't the Standard 50/30/20**

The textbook split of your ${formatCurrencyDisplay(monthlyIncome)} income would be ${formatCurrencyDisplay(baseline.needs)} for Needs, ${formatCurrencyDisplay(baseline.wants)} for Wants, and ${formatCurrencyDisplay(baseline.savings)} for Savings. Your goal needs ${formatCurrencyDisplay(requiredMonthlySavings)} a month, more than that ${formatCurrencyDisplay(baseline.savings)}, so savings is funded first and whatever is left goes to Needs before Wants.`;

  if (!calc.needsBelowBaseline || !monthly) {
    return explanation;
  }

  return `${explanation}

Heads up: that leaves ${formatCurrencyDisplay(monthly.needs)} for Needs, below the ${formatCurrencyDisplay(baseline.needs)} the 50% baseline recommends. If your essentials cost more than that, the honest options are a later deadline, a smaller target, or more income — not skipping groceries.`;
}

/**
 * Renders the whole plan card from already-final numbers. Every dollar figure
 * the user sees originates here, in code, so the AI cannot restate, round, or
 * re-derive any of them; it only supplies the two location tips.
 */
export function buildPlanText(
  calc: PlanCalculation,
  tips: [string, string]
): string {
  const sections = [
    "**Your Personalized Budget Breakdown**",
    renderIncomeBreakdown(calc),
    renderAllocation(calc),
    renderGoalSection(calc),
    `**Tips for ${calc.city}, ${calc.state}**`,
    tips.map((tip) => `- ${tip}`).join("\n"),
  ];

  return sections.filter(Boolean).join("\n\n");
}
