# FinTin AI Advisor Prompt Templates (Refined)

**Model:** Google Gemini (free tier — `gemini-3.5-flash-lite`)
**Author:** Hoang Nguyen
**Date:** August 2026
**Status:** Ready to paste into `app/api/generate-plan/route.ts` and `app/api/generate-report/route.ts`

---

## 0. Shared Advisor Persona

Both prompts open with the same persona line on purpose.

> You are a professional personal finance advisor who specializes in helping college students build financial independence from zero. Your tone is direct, encouraging, and practical — never condescending, never generic. You only reason from the exact data provided below; you never invent income sources, spending habits, or life circumstances that aren't in the data.

**Rationale:** The model has no memory between calls (see Prompt Design Notes below), so the persona has to be re-established from scratch every single time. Repeating the identical sentence in both prompts isn't redundant — it's what keeps the "voice" of the advisor consistent across a plan generated in week 1 and a report generated in week 6, even though they're technically two unrelated API calls.

---



## 1. Prompt 1 — Initial Budgeting Plan

**When it fires:** Once, immediately after the user finishes onboarding step 3 (`/onboarding/plan`), before any real expense or income has ever been logged.

**What kind of data it sees:** Entirely *self-reported estimates* — the money on hand and income sources the user typed in during onboarding. There is no transaction history yet.

**Gemini does not see, produce, or touch a single dollar figure here.** Every number in the plan — monthly income, the 50/30/20 split, the weekly figures, the required monthly savings, the adjusted allocation, the shortfall — is computed and rendered in `lib/plan.ts` and assembled into the final card text in code. The model is asked for exactly one thing: the two location tips.

### Why the numbers moved into code

Earlier versions of this prompt handed Gemini the raw inputs and asked it to do the arithmetic. A later version computed the numbers in code but still passed them to Gemini with an instruction not to recompute them. Both failed in production:

- Nothing verified compliance. The route wrote Gemini's raw text straight into `ai_content`, and the initial plan is permanent (AC4/AC5) — one bad generation is saved forever with no regeneration path.
- The failure was silent. A plan that says `$433.33` reads exactly as authoritative as one that says `$400.00`.

Asking only for prose removes the failure mode rather than policing it, and cuts the token count enough to sit comfortably in the free tier.

### The tips-only prompt

```
${SHARED_PERSONA}

A college student in ${city}, ${state} has just finished onboarding. They
live on ${monthly_income} a month and are saving toward: ${goal_purpose}.
${allocation_sentence}

Write exactly two money-saving tips specific to ${city}, ${state}.
- Tip 1: a specific local spending tip relevant to a college student there.
- Tip 2: a specific local resource, program, or cheaper alternative there.

RULES:
- Name real, specific places, services, or programs in or near ${city},
  ${state}. No generic advice like "cook at home" or "use a budgeting app".
- One or two sentences each.
- Output exactly two lines, each starting with "- ". No heading, no preamble,
  no numbering, no closing remarks.
- Do not mention, restate, or invent any dollar amount. The budget numbers
  are handled elsewhere.
```

The response is parsed into exactly two tip strings. If the call fails or fewer than two tips come back, the route retries once and then returns a 502 — better to surface the existing "Try again" button than to permanently persist a plan with a missing section.

### The calculation contract (`lib/plan.ts`)

- **Four-week months.** `WEEKS_PER_MONTH = 4`, not `52 / 12`. The calendar-accurate 4.3333 bakes a partial fifth payday into every month, so `$100` weekly reads as `$433.33` monthly and the weekly figures no longer reconcile against the monthly ones by hand. With 4, `weekly x 4` returns the monthly figure exactly and a fifth-payday month is an unbudgeted bonus.
- **Integer cents.** Needs and Savings are rounded, Wants takes the remainder, so the three buckets always sum to exactly the monthly income instead of drifting a cent apart.
- **Needs-first adjustment.** When the goal requires more than the 20% baseline, savings is funded first, then Needs up to its 50% baseline, and Wants takes whatever is left. Wants is the discretionary bucket, so it absorbs the squeeze before Needs does. The previous proportional 5:3 squeeze funded Wants while cutting Needs below a livable level, and never explained itself in the output.
- **One operative allocation.** The monthly and weekly blocks always describe the same allocation. When the goal overrides the textbook split, a `**Why This Isn't the Standard 50/30/20**` section states the baseline it replaced and the rule used, and a `needsBelowBaseline` flag adds an explicit sustainability warning.
- **Case C emits no allocation.** When required savings exceeds total income, no split is meaningful, so the plan reports the shortfall and routes to income/deadline options rather than recommending `$0.00` for Needs.
- **Dates parse from string parts.** `monthsRemaining` reads `YYYY-MM-DD` directly. Going through `new Date(iso)` parses as UTC midnight and is then read back with local getters, shifting the day backwards in every negative UTC offset.

### Output structure

The headings (`**Your Personalized Budget Breakdown**`, `**Tips for ${city}, ${state}**`) are the contract the scrollable card at `/onboarding/plan` renders via its `**Heading**` split. Since the text is now assembled in code, that structure is guaranteed rather than requested.

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
- *"Where to Cut Back" scoped to Wants* because the model has no ability to research and validate real, current local housing or grocery-cost alternatives — so a Needs-category flag (e.g., "reduce Rent spending") would be numerically accurate but practically useless, either repeating generic advice or suggesting something too risky to act on, like moving out mid-lease. Wants-category spending, by contrast, is genuinely discretionary and safe to critique without that research gap becoming a liability.
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
- Prompt 1 no longer has an `onboarding_income_summary` placeholder. `users.onboarding_income_json` still stays `jsonb`, but it is read by `calculateInitialPlan` in `lib/plan.ts` and normalized to monthly cents there. The per-source breakdown the user sees (`- Mom and Dad: $100.00 Weekly ($400.00 per month)`) is rendered in code, not by the model, so each line is traceable back to the exact onboarding entry it came from.



### Statelessness

Both prompts are fully stateless. Every fact Gemini needs is inlined into the prompt body at call time — there is no conversation history, no system-level memory, and no assumption Gemini "remembers" the user from a previous call. This is a hard constraint of the free-tier Flash models, and it's why the persona line and the "don't reference outside data" instructions have to be repeated in full every time rather than set once.

### Variable to Data Source Map


Prompt 1's only remaining placeholders are `${city}`, `${state}`, `${goal_purpose}`, `${monthly_income}`, and `${allocation_sentence}` — just enough context for the model to write locally relevant tips. Everything else in the table below feeds Prompt 2 or is rendered into the plan card by `lib/plan.ts` without ever reaching the model.

| Prompt placeholder                  | Source                         | Notes                                                                                                                                                                         |
| ----------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `${opening_balance}`                | `users.opening_balance`        | Prompt 1: consumed by `calculateInitialPlan`, never sent to the model; formatted to `"$X.XX"` in code                                                                          |
| `${monthly_income}`                 | `users.onboarding_income_json` | normalized to monthly cents in `lib/plan.ts` (Weekly x4, Bi-weekly x2, Monthly x1); column itself stays `jsonb`                                                               |
| `${allocation_sentence}`            | computed at request time       | one sentence giving the model the monthly Needs and Wants figures as context only; omitted in Case C, where no allocation exists                                              |
| `${goal_purpose}`                   | `users.goal_purpose`           | direct                                                                                                                                                                        |
| `${goal_target_amount}`             | `users.goal_target_amount`     | Prompt 1: consumed by `calculateInitialPlan`, never sent to the model; formatted to `"$X.XX"` in code                                                                          |
| `${goal_deadline}`                  | `users.goal_deadline`          | parsed from `YYYY-MM-DD` string parts, never through `new Date(iso)`                                                                                                          |
| `${city}` / `${state}`              | `users.city` / `users.state`   | direct                                                                                                                                                                        |
| `${expenses_data}`                  | `expenses` rows                | filtered by `logged_at` within period, date-formatted, flattened to one sentence                                                                                              |
| `${income_data}`                    | `income_entries` rows          | filtered by `logged_at` within period, date-formatted, flattened to one sentence                                                                                              |
| `${current_balance}`                | computed at request time       | `opening_balance` + Σ `income_entries.amount` − Σ `expenses.amount`; never stored, matches the "Total Money on Hand computed on the fly" rule; formatted to `"$X.XX"` in code |
| `${period_start}` / `${period_end}` | computed at request time       | derived from `users.created_at` or the most recent `ai_content.period_end`; only written to `ai_content` *after* the report is generated, not read from it beforehand         |
| `${report_type}`                    | computed at request time       | one value (`'weekly'` or `'monthly'`) reused identically for both the prompt and `ai_content.type`                                                                            |


