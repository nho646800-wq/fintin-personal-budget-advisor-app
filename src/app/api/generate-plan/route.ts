import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatCurrencyDisplay } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Timing is now a fixed 3-option dropdown (Weekly / Bi-weekly / Monthly) set
// during onboarding Step 2. These three exact strings are the only valid
// values — the onboarding form's <select> option values must match them
// character-for-character (including capitalization) or normalizeToMonthly
// below will throw instead of silently guessing wrong.
// ---------------------------------------------------------------------------
type IncomeTiming = "Weekly" | "Bi-weekly" | "Monthly";

type OnboardingIncomeEntry = {
  source: string;
  amount: number;
  timing: IncomeTiming;
};

type UserRow = {
  opening_balance: number | null;
  onboarding_income_json: OnboardingIncomeEntry[] | null;
  goal_purpose: string | null;
  goal_target_amount: number | null;
  goal_deadline: string | null;
  city: string;
  state: string;
};

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const AI_CONTENT_TYPE = "initial_plan";

const WEEKS_PER_MONTH = 52 / 12; // 4.3333...

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Converts a single income entry to its monthly-equivalent dollar amount.
 * Only three timing values are valid now that onboarding uses a fixed
 * dropdown — no free-text parsing, no substring guessing.
 */
function normalizeToMonthly(amount: number, timing: IncomeTiming): number {
  switch (timing) {
    case "Weekly":
      return amount * WEEKS_PER_MONTH;
    case "Bi-weekly":
      return amount * (WEEKS_PER_MONTH / 2);
    case "Monthly":
      return amount;
    default: {
      // Exhaustiveness check — if IncomeTiming ever grows a 4th option,
      // this fails to compile until it's handled above. If it fires at
      // runtime, the onboarding form is sending a value that doesn't match
      // one of the three exactly — fix the form, don't patch this switch.
      const _exhaustive: never = timing;
      throw new Error(`Unhandled income timing: ${_exhaustive}`);
    }
  }
}

type PlanCase = "A" | "B" | "C" | "FUNDED";

interface PlanCalculation {
  planCase: PlanCase;
  monthlyIncome: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
  baselineNeeds: number;
  baselineWants: number;
  baselineSavings: number;
  weeklyNeeds: number;
  weeklyWants: number;
  weeklySavings: number;
  adjustedNeeds: number;
  adjustedWants: number;
  adjustedSavings: number;
  shortfall: number;
}

/**
 * Every dollar figure the plan needs, computed deterministically in code.
 * Gemini never sees raw numbers to compute from — only these final results,
 * already decided and rounded. This replaces the earlier approach of asking
 * Gemini to compute required savings and pick a case itself, which produced
 * inconsistent sums and wrong case selection even under high thinking effort.
 */
function calculateInitialPlan(
  openingBalance: number,
  incomeEntries: OnboardingIncomeEntry[],
  goalTargetAmount: number,
  goalDeadline: string, // "YYYY-MM-DD"
  today: string
): PlanCalculation {
  const monthlyIncome = round2(
    incomeEntries.reduce(
      (sum, entry) => sum + normalizeToMonthly(entry.amount, entry.timing),
      0
    )
  );

  const start = new Date(today);
  const end = new Date(goalDeadline);
  let monthsRemaining =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) monthsRemaining -= 1;
  monthsRemaining = Math.max(1, monthsRemaining);

  const baselineNeeds = round2(monthlyIncome * 0.5);
  const baselineWants = round2(monthlyIncome * 0.3);
  const baselineSavings = round2(monthlyIncome * 0.2);
  const weeklyNeeds = round2(baselineNeeds / WEEKS_PER_MONTH);
  const weeklyWants = round2(baselineWants / WEEKS_PER_MONTH);
  const weeklySavings = round2(baselineSavings / WEEKS_PER_MONTH);

  const gap = goalTargetAmount - openingBalance;

  if (gap <= 0) {
    return {
      planCase: "FUNDED",
      monthlyIncome,
      monthsRemaining,
      requiredMonthlySavings: 0,
      baselineNeeds,
      baselineWants,
      baselineSavings,
      weeklyNeeds,
      weeklyWants,
      weeklySavings,
      adjustedNeeds: 0,
      adjustedWants: 0,
      adjustedSavings: 0,
      shortfall: 0,
    };
  }

  const requiredMonthlySavings = round2(gap / monthsRemaining);

  let planCase: PlanCase;
  let adjustedNeeds = baselineNeeds;
  let adjustedWants = baselineWants;
  let adjustedSavings = baselineSavings;
  let shortfall = 0;

  if (requiredMonthlySavings <= baselineSavings) {
    planCase = "A";
  } else if (requiredMonthlySavings <= monthlyIncome) {
    planCase = "B";
    adjustedSavings = requiredMonthlySavings;
    const remaining = round2(monthlyIncome - adjustedSavings);
    adjustedNeeds = round2(remaining * (5 / 8));
    adjustedWants = round2(remaining - adjustedNeeds); // guarantees exact sum
  } else {
    planCase = "C";
    adjustedSavings = monthlyIncome;
    adjustedNeeds = 0;
    adjustedWants = 0;
    shortfall = round2(requiredMonthlySavings - monthlyIncome);
  }

  return {
    planCase,
    monthlyIncome,
    monthsRemaining,
    requiredMonthlySavings,
    baselineNeeds,
    baselineWants,
    baselineSavings,
    weeklyNeeds,
    weeklyWants,
    weeklySavings,
    adjustedNeeds,
    adjustedWants,
    adjustedSavings,
    shortfall,
  };
}

// ---------------------------------------------------------------------------
// Prompt 1 — Initial Budgeting Plan (v2)
//
// All dollar figures and the plan case are computed by calculateInitialPlan
// above and handed to Gemini as already-final. Gemini's only two jobs are:
// (1) slot these exact numbers into the required structure, and
// (2) write the two location tips. It never computes anything itself.
// ---------------------------------------------------------------------------

const SHARED_PERSONA =
  "You are a professional personal finance advisor who specializes in helping college students build financial independence from zero. Your tone is direct, encouraging, and practical — never condescending, never generic. You only reason from the exact data provided below; you never invent income sources, spending habits, or life circumstances that aren't in the data.";

function buildInitialPlanPrompt(params: {
  planCase: PlanCase;
  openingBalance: string;
  goalPurpose: string;
  goalTargetAmount: string;
  goalDeadline: string;
  city: string;
  state: string;
  monthlyIncome: string;
  monthsRemaining: number;
  requiredMonthlySavings: string;
  baselineNeeds: string;
  baselineWants: string;
  baselineSavings: string;
  weeklyNeeds: string;
  weeklyWants: string;
  weeklySavings: string;
  adjustedNeeds: string;
  adjustedWants: string;
  adjustedSavings: string;
  shortfall: string;
}): string {
  const {
    planCase,
    openingBalance,
    goalPurpose,
    goalTargetAmount,
    goalDeadline,
    city,
    state,
    monthlyIncome,
    monthsRemaining,
    requiredMonthlySavings,
    baselineNeeds,
    baselineWants,
    baselineSavings,
    weeklyNeeds,
    weeklyWants,
    weeklySavings,
    adjustedNeeds,
    adjustedWants,
    adjustedSavings,
    shortfall,
  } = params;

  const goalSentence =
    planCase === "FUNDED"
      ? `Your current ${openingBalance} already meets or exceeds your ${goalTargetAmount} goal — you don't need to save anything further to reach it by ${goalDeadline}.`
      : `To reach your ${goalPurpose} goal of ${goalTargetAmount} by ${goalDeadline}, you need to save ${requiredMonthlySavings} per month (based on ${monthsRemaining} months remaining).`;

  const warningSection =
    planCase === "B" || planCase === "C"
      ? `\n⚠️ Warning: Your goal requires a savings rate higher than the standard 20%.\nAdjusted recommended allocation:\n- Needs: ${adjustedNeeds} | Wants: ${adjustedWants} | Savings: ${adjustedSavings}\n`
      : "";

  const insufficientIncomeSection =
    planCase === "C"
      ? `\n⚠️ **Your Income May Not Be Enough to Hit This Deadline**\nEven saving 100% of your ${monthlyIncome}/month income, you'd still fall\nshort by ${shortfall} per month to reach your ${goalPurpose} goal on time.\nTo close this gap:\n- **Increase your income:** look into a part-time or on-campus job, work-study\n  position, or internship. Check your school's official career center or\n  student employment office, and general platforms like Handshake, Indeed,\n  or LinkedIn Jobs.\n- **Cut spending further:** once you start logging real expenses, your\n  weekly advice reports will point to specific categories to trim.\n- This projection only uses what you entered today — any income you didn't\n  report, or flexibility in your timeline outside the app, would change it.\n`
      : "";

  return `${SHARED_PERSONA}

This is a first-time initial plan. The user has just finished onboarding
and has not logged any real expenses or income yet — everything below is
their own estimate of their finances, not observed transaction history.
Treat it as a starting baseline, not a verified spending pattern.

USER DATA (all numbers below are already calculated and final):
- Case: ${planCase}
- Current money on hand: ${openingBalance}
- Savings goal: ${goalPurpose}
- Target savings amount: ${goalTargetAmount}
- Goal deadline: ${goalDeadline}
- Location: ${city}, ${state}
- Monthly income: ${monthlyIncome}
- Months remaining until deadline: ${monthsRemaining}
- Required monthly savings to hit the goal: ${requiredMonthlySavings}
- Baseline Needs / Wants / Savings (50/30/20 of monthly income): ${baselineNeeds} / ${baselineWants} / ${baselineSavings}
- Baseline weekly Needs / Wants / Savings: ${weeklyNeeds} / ${weeklyWants} / ${weeklySavings}
- Adjusted Needs / Wants / Savings (only used if Case is B or C): ${adjustedNeeds} / ${adjustedWants} / ${adjustedSavings}
- Shortfall (only used if Case is C): ${shortfall}

CRITICAL: Every number above is already correct and final. Do not recompute,
re-derive, round differently, or "double check" any of them — use them
exactly as given. Your only two jobs are: (1) place these exact numbers into
the structure below, and (2) write the two location tips using only the
data given.

REQUIRED OUTPUT — respond in exactly this structure:

**Your Personalized Budget Breakdown**

Monthly Allocation (based on your ${monthlyIncome}/month expected income):
- Needs (50%): ${baselineNeeds}
- Wants (30%): ${baselineWants}
- Savings (20%): ${baselineSavings}

Weekly Allocation:
- Needs: ${weeklyNeeds} per week
- Wants: ${weeklyWants} per week
- Savings: ${weeklySavings} per week

${goalSentence}
${warningSection}${insufficientIncomeSection}
Tips for ${city}, ${state}:
- [One specific local spending tip relevant to a college student]
- [One specific local resource or cheaper alternative]

Do not give generic advice for the tips. Do not alter, round, or recompute
any dollar figure given above — copy them exactly as provided.`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini request failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini response did not contain any text.");
  }

  return text;
}

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to generate a plan." },
      { status: 401 }
    );
  }

  // The initial plan is a one-time, permanent artifact (US-003 AC4/AC5) — if
  // one already exists for this user, return it as-is instead of generating
  // (and billing for) a new one on every visit/refresh.
  const { data: existingPlan } = await supabase
    .from("ai_content")
    .select("content")
    .eq("user_id", user.id)
    .eq("type", AI_CONTENT_TYPE)
    .maybeSingle();

  if (existingPlan?.content) {
    return NextResponse.json({ content: existingPlan.content });
  }

  const { data, error: userError } = await supabase
    .from("users")
    .select(
      "opening_balance, onboarding_income_json, goal_purpose, goal_target_amount, goal_deadline, city, state"
    )
    .eq("id", user.id)
    .single();

  const userRow = data as UserRow | null;

  if (userError || !userRow) {
    return NextResponse.json(
      { error: userError?.message ?? "User record not found." },
      { status: 404 }
    );
  }

  if (
    userRow.opening_balance == null ||
    userRow.goal_purpose == null ||
    userRow.goal_target_amount == null ||
    userRow.goal_deadline == null ||
    !userRow.onboarding_income_json ||
    userRow.onboarding_income_json.length === 0
  ) {
    return NextResponse.json(
      { error: "Onboarding is not complete yet." },
      { status: 400 }
    );
  }

  const today = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"

  const plan = calculateInitialPlan(
    userRow.opening_balance,
    userRow.onboarding_income_json,
    userRow.goal_target_amount,
    userRow.goal_deadline,
    today
  );

  const prompt = buildInitialPlanPrompt({
    planCase: plan.planCase,
    openingBalance: formatCurrencyDisplay(userRow.opening_balance),
    goalPurpose: userRow.goal_purpose,
    goalTargetAmount: formatCurrencyDisplay(userRow.goal_target_amount),
    goalDeadline: userRow.goal_deadline,
    city: userRow.city,
    state: userRow.state,
    monthlyIncome: formatCurrencyDisplay(plan.monthlyIncome),
    monthsRemaining: plan.monthsRemaining,
    requiredMonthlySavings: formatCurrencyDisplay(plan.requiredMonthlySavings),
    baselineNeeds: formatCurrencyDisplay(plan.baselineNeeds),
    baselineWants: formatCurrencyDisplay(plan.baselineWants),
    baselineSavings: formatCurrencyDisplay(plan.baselineSavings),
    weeklyNeeds: formatCurrencyDisplay(plan.weeklyNeeds),
    weeklyWants: formatCurrencyDisplay(plan.weeklyWants),
    weeklySavings: formatCurrencyDisplay(plan.weeklySavings),
    adjustedNeeds: formatCurrencyDisplay(plan.adjustedNeeds),
    adjustedWants: formatCurrencyDisplay(plan.adjustedWants),
    adjustedSavings: formatCurrencyDisplay(plan.adjustedSavings),
    shortfall: formatCurrencyDisplay(plan.shortfall),
  });

  let content: string;
  try {
    content = await callGemini(prompt);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate your plan.",
      },
      { status: 502 }
    );
  }

  const { error: insertError } = await supabase.from("ai_content").insert({
    user_id: user.id,
    type: AI_CONTENT_TYPE,
    content,
  });

  if (insertError) {
    // A concurrent request may have won the insert race (common under
    // React Strict Mode remounts). If a row now exists, return that plan
    // instead of surfacing a failure that would leave the UI stuck.
    const { data: racedPlan } = await supabase
      .from("ai_content")
      .select("content")
      .eq("user_id", user.id)
      .eq("type", AI_CONTENT_TYPE)
      .maybeSingle();

    if (racedPlan?.content) {
      return NextResponse.json({ content: racedPlan.content });
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ content });
}