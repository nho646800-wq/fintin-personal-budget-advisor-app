import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatCurrencyDisplay } from "@/lib/currency";

type OnboardingIncomeEntry = {
  source: string;
  amount: number;
  timing: string;
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

// ---------------------------------------------------------------------------
// Prompt 1 — Initial Budgeting Plan
//
// Reproduced character-for-character from
// `prompts/ai-advisor-prompt-template.md` (Section 0 + Section 1). Only the
// ${...} placeholders are substituted with real, code-formatted values —
// the surrounding wording, framing, and REQUIRED OUTPUT contract must never
// be paraphrased or restructured here. If the plan card ever renders wrong,
// check this string against the doc before touching anything else.
// ---------------------------------------------------------------------------

const SHARED_PERSONA =
  "You are a professional personal finance advisor who specializes in helping college students build financial independence from zero. Your tone is direct, encouraging, and practical — never condescending, never generic. You only reason from the exact data provided below; you never invent income sources, spending habits, or life circumstances that aren't in the data.";

function buildInitialPlanPrompt(params: {
  openingBalance: string;
  onboardingIncomeSummary: string;
  goalPurpose: string;
  goalTargetAmount: string;
  goalDeadline: string;
  city: string;
  state: string;
}): string {
  const {
    openingBalance,
    onboardingIncomeSummary,
    goalPurpose,
    goalTargetAmount,
    goalDeadline,
    city,
    state,
  } = params;

  return `${SHARED_PERSONA}

This is a first-time initial plan. The user has just finished onboarding
and has not logged any real expenses or income yet — everything below is
their own estimate of their finances, not observed transaction history.
Treat it as a starting baseline, not a verified spending pattern.

Using the 50/30/20 framework, build a personalized initial budget from
the data below. Infer constraints only from the specific numbers given —
do not assume a steady paycheck, a typical adult income pattern, or any
detail not present in the data.

USER DATA:
- Current money on hand: ${openingBalance}
- Expected income sources (self-reported at onboarding): ${onboardingIncomeSummary}
- Savings goal: ${goalPurpose}
- Target savings amount: ${goalTargetAmount}
- Goal deadline: ${goalDeadline}
- Location: ${city}, ${state}

REQUIRED OUTPUT — respond in exactly this structure, nothing more:

**Your Personalized Budget Breakdown**

Monthly Allocation:
- Needs (50%): $[amount]
- Wants (30%): $[amount]
- Savings (20%): $[amount]

Weekly Allocation:
- Needs: $[amount] per week
- Wants: $[amount] per week
- Savings: $[amount] per week

To reach your ${goalPurpose} goal of ${goalTargetAmount} by
${goalDeadline}, you need to save $[calculated monthly amount] per month.

[Only if the required monthly savings exceeds the standard 20% share of
available funds, include this section — otherwise omit it entirely:]
⚠️ Warning: Your goal requires a savings rate higher than the standard 20%.
Adjusted recommended allocation:
- Needs: $[amount] | Wants: $[amount] | Savings: $[amount]

Tips for ${city}, ${state}:
- [One specific local spending tip relevant to a college student]
- [One specific local resource or cheaper alternative]

Use exact dollar amounts throughout, calculated from the numbers given.
Do not give generic advice. Do not assume the user has a steady adult-style
income — they are a college student with irregular, part-time, or
allowance-based income.`;
}

/**
 * Flattens `users.onboarding_income_json` into the plain-sentence form
 * Prompt 1 expects, e.g.
 * `"Part-time job: ~$320 twice a month; Parental allowance: ~$200 once a month"`.
 * The `~` flags these as self-reported onboarding estimates rather than
 * confirmed amounts. This never writes back to the `jsonb` column — only
 * this derived copy is handed to the prompt.
 */
function buildOnboardingIncomeSummary(
  entries: OnboardingIncomeEntry[] | null
): string {
  if (!entries || entries.length === 0) {
    return "None reported at onboarding.";
  }

  return entries
    .map((entry) => `${entry.source}: ~$${entry.amount} ${entry.timing}`)
    .join("; ");
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
    userRow.goal_deadline == null
  ) {
    return NextResponse.json(
      { error: "Onboarding is not complete yet." },
      { status: 400 }
    );
  }

  const prompt = buildInitialPlanPrompt({
    openingBalance: formatCurrencyDisplay(userRow.opening_balance),
    onboardingIncomeSummary: buildOnboardingIncomeSummary(
      userRow.onboarding_income_json
    ),
    goalPurpose: userRow.goal_purpose,
    goalTargetAmount: formatCurrencyDisplay(userRow.goal_target_amount),
    goalDeadline: userRow.goal_deadline,
    city: userRow.city,
    state: userRow.state,
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
