# FinTin AI Advisor Prompt Templates (Refined)

**Model:** Google Gemini 1.5 Flash
**Author:** Hoang Nguyen
**Date:** August 2026
**Status:** Ready to paste into `app/api/generate-plan/route.ts` and `app/api/generate-report/route.ts`

---

## 0. Shared Advisor Persona

Both prompts open with the same persona line on purpose.

> You are a professional personal finance advisor who specializes in helping college students build financial independence from zero. Your tone is direct, encouraging, and practical — never condescending, never generic. You only reason from the exact data provided below; you never invent income sources, spending habits, or life circumstances that aren't in the data.

**Rationale:** Gemini 1.5 Flash has no memory between calls (see Prompt Design Notes below), so the persona has to be re-established from scratch every single time. Repeating the identical sentence in both prompts isn't redundant — it's what keeps the "voice" of the advisor consistent across a plan generated in week 1 and a report generated in week 6, even though they're technically two unrelated API calls.

---



## 1. Prompt 1 — Initial Budgeting Plan

**When it fires:** Once, immediately after the user finishes onboarding step 3 (`/onboarding/plan`), before any real expense or income has ever been logged.

**What kind of data it sees:** Entirely *self-reported estimates* — the money on hand and income sources the user typed in during onboarding. There is no transaction history yet. The prompt has to say this explicitly, or Gemini may phrase the output as if it's reacting to observed behavior it doesn't actually have.

```
${SHARED_PERSONA}

This is a first-time initial plan. The user has just finished onboarding
and has not logged any real expenses or income yet — everything below is
their own estimate of their finances, not observed transaction history.
Treat it as a starting baseline, not a verified spending pattern.

Using the 50/30/20 framework, build a personalized initial budget from
the data below. Infer constraints only from the specific numbers given —
do not assume a steady paycheck, a typical adult income pattern, or any
detail not present in the data.

USER DATA:
- Current money on hand: ${opening_balance}
- Expected income sources (self-reported at onboarding): ${onboarding_income_summary}
- Savings goal: ${goal_purpose}
- Target savings amount: ${goal_target_amount}
- Goal deadline: ${goal_deadline}
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

To reach your ${goal_purpose} goal of ${goal_target_amount} by
${goal_deadline}, you need to save $[calculated monthly amount] per month.

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
allowance-based income.
```

**Design rationale:**

- *"This is a first-time initial plan... not observed transaction history"* — added directly because this prompt runs on estimates only. Without this framing, Gemini tends to write as if it already knows the student's habits ("you tend to overspend on..."), which is a hallucination risk when there's zero real data to back that claim.
- *Conditional warning block* is phrased as an if/then instruction rather than always-included, so the output stays clean for the common case (goal is achievable within 20%) and only adds friction when the math actually requires it — mirrors how a real advisor would flag a problem only when there is one.
- *"Do not assume a steady paycheck"* is repeated twice (once near the top, once near the bottom) because it's the single most common way a generic LLM finance prompt fails for this audience — it defaults to salaried-adult assumptions unless told not to, twice.
- The exact heading structure (`**Your Personalized Budget Breakdown**`, `Monthly Allocation:`, etc.) isn't cosmetic — it's the contract the frontend renders inside the scrollable card at `/onboarding/plan`. If Gemini drifts from this structure, the card either breaks or shows unformatted text, so "respond in exactly this structure, nothing more" is load-bearing, not a style note.
- Every dollar-value placeholder (`${opening_balance}`, `${goal_target_amount}`) is inlined **without** a literal `$` in the template itself. The API route code is responsible for formatting these as ready-to-read currency strings (e.g. `"$450.00"`) before interpolation — see the Formatting Standard note below. The `$[amount]` markers inside REQUIRED OUTPUT are a different thing entirely: they're instructions telling Gemini what *its own* output should look like, not app-supplied variables, so those stay as-is.

---



## 2. Prompt 2 — Weekly / Monthly Advice Report

**When it fires:** At the end of each completed weekly (or every 4th week, monthly) period, only when the report window is open (see the availability logic in the `/report` build prompt).

**What kind of data it sees:** Real, logged behavior — actual expenses and income entries scoped strictly to the reporting period. This is the opposite data situation from Prompt 1, so the prompt has to say so, or Gemini may casually reference the user's onboarding estimates or a prior period it was never given.

```
${SHARED_PERSONA}

This is a periodic advice report based entirely on real, logged activity —
not an estimate. Use only the expenses and income listed for this exact
period below. Do not reference, average against, or assume anything about
data from outside this period, including the user's original onboarding
estimates.

USER DATA:
- Report period: ${period_start} to ${period_end}
- Report type: ${report_type} (weekly or monthly)
- Current money on hand: ${current_balance}
- Savings goal: ${goal_purpose} — Target ${goal_target_amount} by ${goal_deadline}
- Expenses this period: ${expenses_data}
- Income received this period: ${income_data}
- Location: ${city}, ${state}

REQUIRED OUTPUT — respond in exactly this structure, nothing more:

**Your ${report_type} Advice Report**
Period: ${period_start} — ${period_end}

**Spending Summary**
[Two sentences, grounded only in the data above: what the user spent on,
where they spent most, and the one clearest pattern this period.]

**Where to Cut Back**
- [Specific subcategory under Wants that was spent on the most]: You spent $[amount].
  Reduce to $[suggested amount] next period.
- [A subcategory under Needs only if the data genuinely supports flagging it]

**A Cheaper Alternative Near You**
[One real, specific option in ${city}, ${state} tied to one of the user's
actual expense subcategories from this period.]

**Savings Progress**
You currently have ${current_balance} toward your ${goal_target_amount}
${goal_purpose} goal.
[One sentence stating, based only on current balance and deadline math,
whether they're on track.]

**This Week, Try:**
[One specific, actionable step based only on this period's actual data.]

Use exact dollar amounts from the data given. Never invent a category,
merchant, or number that isn't present in the expenses or income data above.
```

**Design rationale:**

- *"Do not reference... the user's original onboarding estimates"* is the key line separating this prompt from Prompt 1. Since both prompts eventually share a codebase and a user, without this instruction Gemini can blend the two data sources and produce advice that mixes a week-one estimate with week-six reality — which would be actively misleading in a report meant to reflect only real behavior.
- *"Where to Cut Back" scoped to Wants* because Gemini 1.5 Flash has no ability to research and validate real, current local housing or grocery-cost alternatives — so a Needs-category flag (e.g., "reduce Rent spending") would be numerically accurate but practically useless, either repeating generic advice or suggesting something too risky to act on, like moving out mid-lease. Wants-category spending, by contrast, is genuinely discretionary and safe to critique without that research gap becoming a liability.
- *"A subcategory under Needs only if the data genuinely supports flagging it"* replaces a plain "if a second category warrants mention, add it" — reworded to push Gemini toward omission of essential, indispensable Needs spending by default. A short, well-grounded report beats a padded one, especially for a weekly cadence where the student will see this format repeatedly.
- The report's headers again map 1:1 to the scrollable card UI in `/report`, and the period line format matches how `ai_content.period_start` / `period_end` are stored, so the exact string format isn't arbitrary — it's what keeps the AI output and the stored DB fields visually consistent when a user looks back at old reports.
- Same as Prompt 1: `${current_balance}`, `${goal_target_amount}` carry no literal `$` in the template — formatting happens in code, not in the prompt string.

---



## 3. Prompt Design Notes



### Formatting standard

All currency values are formatted as ready-to-read strings (e.g. `"$450.00"`) **in the API route code**, before they're interpolated into either prompt. Neither template ever hardcodes a `$` next to a variable. This keeps both prompts visually identical in style and means currency formatting logic lives in exactly one place — the codebase — instead of being split between the template text and whatever formatting the route happens to conform to. If a dollar sign is ever missing from generated output, the bug is in the formatting function, not in the prompt.

### Report type

`${report_type}` is computed once from elapsed-time logic and that exact same string — `'weekly'` or `'monthly'` — is used both inside the prompt and as the value saved to `ai_content.type`. One computed value, reused in both places, so there's no possibility of the prompt saying "weekly" while the DB stores something differently-shaped. (`'initial_plan'` remains distinct enough from `'weekly'`/`'monthly'` that no `_report` suffix is needed for the values to stay unambiguous in the table.)

### Translation layer

Nothing about the Supabase schema changes. `users.onboarding_income_json` stays `jsonb`, `expenses.logged_at` / `income_entries.logged_at` stay `timestamptz`. A small formatting function runs **between** the Supabase query and the Gemini `fetch()` call, converting each raw field into the plain-sentence form the prompt expects:

- `expenses_data` **format:** `"Groceries (Needs): $45.00 — note: Walmart run; Dining (Wants): $14.75 — note: Panda Express"` — built from `expenses.subcategory`, `expenses.main_category`, `expenses.amount`, `expenses.note`, filtered by `expenses.logged_at` within the period. `logged_at` is date-formatted (`MM/DD/YYYY`) before insertion — the raw timestamptz is never passed through as-is.
- `income_data` **format:** `"Part-time job: $320.00 on 08/12/2026; Parental allowance: $200.00 on 08/10/2026"` — built from `income_entries.source`, `income_entries.amount`, filtered by `income_entries.logged_at` within the period, same date-only formatting.
- `onboarding_income_summary` **format:** `"Part-time job: ~$320 twice a month; Parental allowance: ~$200 once a month"` — deliberately uses `~` to visually flag these as onboarding estimates rather than confirmed amounts, reinforcing the same distinction made in the prompt text itself. Built from the raw array in `users.onboarding_income_json` — the column stays `jsonb` in Supabase; only the copy handed to the prompt is a flattened sentence.



### Statelessness

Both prompts are fully stateless. Every fact Gemini needs is inlined into the prompt body at call time — there is no conversation history, no system-level memory, and no assumption Gemini "remembers" the user from a previous call. This is a hard constraint of Gemini 1.5 Flash, and it's why the persona line and the "don't reference outside data" instructions have to be repeated in full every time rather than set once.

### Variable to Data Source Map


| Prompt placeholder                  | Source                         | Notes                                                                                                                                                                         |
| ----------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `${opening_balance}`                | `users.opening_balance`        | formatted to `"$X.XX"` in code                                                                                                                                                |
| `${onboarding_income_summary}`      | `users.onboarding_income_json` | flattened to a readable sentence by the translation function; column itself stays `jsonb`                                                                                     |
| `${goal_purpose}`                   | `users.goal_purpose`           | direct                                                                                                                                                                        |
| `${goal_target_amount}`             | `users.goal_target_amount`     | formatted to `"$X.XX"` in code                                                                                                                                                |
| `${goal_deadline}`                  | `users.goal_deadline`          | direct                                                                                                                                                                        |
| `${city}` / `${state}`              | `users.city` / `users.state`   | direct                                                                                                                                                                        |
| `${expenses_data}`                  | `expenses` rows                | filtered by `logged_at` within period, date-formatted, flattened to one sentence                                                                                              |
| `${income_data}`                    | `income_entries` rows          | filtered by `logged_at` within period, date-formatted, flattened to one sentence                                                                                              |
| `${current_balance}`                | computed at request time       | `opening_balance` + Σ `income_entries.amount` − Σ `expenses.amount`; never stored, matches the "Total Money on Hand computed on the fly" rule; formatted to `"$X.XX"` in code |
| `${period_start}` / `${period_end}` | computed at request time       | derived from `users.created_at` or the most recent `ai_content.period_end`; only written to `ai_content` *after* the report is generated, not read from it beforehand         |
| `${report_type}`                    | computed at request time       | one value (`'weekly'` or `'monthly'`) reused identically for both the prompt and `ai_content.type`                                                                            |


