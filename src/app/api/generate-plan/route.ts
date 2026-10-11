import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatCurrencyDisplay } from "@/lib/currency";
import {
  buildPlanText,
  calculateInitialPlan,
  type OnboardingIncomeEntry,
  type PlanCalculation,
} from "@/lib/plan";

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
// Prompt 1 — Initial Budgeting Plan (v3)
//
// Every dollar figure in the plan is computed and rendered by lib/plan.ts.
// Gemini is handed no arithmetic at all; its entire job is the two location
// tips. Earlier versions passed it final numbers and instructed it not to
// recompute them, but nothing verified that it complied, and the plan is a
// permanent artifact — one bad generation was saved forever. Asking only for
// prose removes the failure mode instead of policing it.
// ---------------------------------------------------------------------------

const SHARED_PERSONA =
  "You are a professional personal finance advisor who specializes in helping college students build financial independence from zero. Your tone is direct, encouraging, and practical — never condescending, never generic. You only reason from the exact data provided below; you never invent income sources, spending habits, or life circumstances that aren't in the data.";

function buildTipsPrompt(calc: PlanCalculation): string {
  const allocation = calc.monthly
    ? `They have ${formatCurrencyDisplay(calc.monthly.needs)} a month for needs and ${formatCurrencyDisplay(calc.monthly.wants)} a month for wants.`
    : `Their income does not currently stretch to cover their savings goal, so every dollar counts.`;

  return `${SHARED_PERSONA}

A college student in ${calc.city}, ${calc.state} has just finished onboarding. They live on ${formatCurrencyDisplay(calc.monthlyIncome)} a month and are saving toward: ${calc.goalPurpose}. ${allocation}

Write exactly two money-saving tips specific to ${calc.city}, ${calc.state}.
- Tip 1: a specific local spending tip relevant to a college student there.
- Tip 2: a specific local resource, program, or cheaper alternative there.

RULES:
- Name real, specific places, services, or programs in or near ${calc.city}, ${calc.state}. No generic advice like "cook at home" or "use a budgeting app".
- One or two sentences each.
- Output exactly two lines, each starting with "- ". No heading, no preamble, no numbering, no closing remarks.
- Do not mention, restate, or invent any dollar amount. The budget numbers are handled elsewhere.`;
}

async function requestTips(prompt: string): Promise<[string, string]> {
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
    throw new Error(`Gemini request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini response did not contain any text.");
  }

  const tips = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  if (tips.length < 2) {
    throw new Error("Gemini did not return two usable tips.");
  }

  return [tips[0], tips[1]];
}

/**
 * The plan is permanent (US-003 AC4/AC5), so a half-formed one must never be
 * persisted. One retry covers a transient blip; past that we surface the
 * error and let the user hit the existing Try again button.
 */
async function requestTipsWithRetry(prompt: string): Promise<[string, string]> {
  try {
    return await requestTips(prompt);
  } catch {
    return await requestTips(prompt);
  }
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

  let calc: PlanCalculation;
  try {
    calc = calculateInitialPlan({
      openingBalance: userRow.opening_balance,
      incomeEntries: userRow.onboarding_income_json,
      goalPurpose: userRow.goal_purpose,
      goalTargetAmount: userRow.goal_target_amount,
      goalDeadline: userRow.goal_deadline,
      city: userRow.city,
      state: userRow.state,
      today,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Your onboarding answers could not be turned into a plan.",
      },
      { status: 400 }
    );
  }

  let tips: [string, string];
  try {
    tips = await requestTipsWithRetry(buildTipsPrompt(calc));
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

  const content = buildPlanText(calc, tips);

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
