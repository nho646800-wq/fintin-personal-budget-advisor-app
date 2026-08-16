# Feature Priority List

**Project:** Fintin — LLM-Integrated Personal Budget Advisor
**Author:** Hoang Nguyen
**Date:** August 2026
**Purpose:** Defines build order and scope for v1.0 delivery

---

## Priority Tiers

**P1 — Build first. App cannot function or be demonstrated without these.**

**P2 — Build second. Core user value. Demo is weak without these.**

**P3 — Build last. Enhances overall user experience but demo will still be sufficient without them.**

---

## P1 — Critical Path (Build in this exact order)

### 1. Authentication

**Why first:** Every other feature requires a logged-in user
with a registered portal in the database. Without this nothing else 
can be built or tested.

Scope:

- Sign up with email, password, city, state

- Log in with email and password

- Authenticated session persists across page refreshes

- All routes redirect to login if unauthenticated

### 2. Three-Step Onboarding

**Why second:** Gathers the data that every other
screen depends on — opening balance, savings goal,
and the onboarding income entries for the AI plan -
to fully function.

Scope:

- Step 1: Total Money on Hand input

- Step 2: Income entries (source, amount, timing)

- Step 3: Savings goal (purpose dropdown + custom,
  target amount, deadline)
- Validation on all required fields

- Onboarding only shown once — skipped on
  subsequent logins

### 3. Initial AI Budgeting Plan

**Why third:** This is the first AI output the user sees
and the highest-value moment in the demo.
Must work immediately after onboarding completes.
When loading, the screen must also not break to make
the flow consistent and enhance user experience.

Scope:

- Gemini called immediately after onboarding
  with opening balance, income entries, savings
  goal amount, deadline, and city/state

- Response displays as a saved, scrollable plan card

- Plan stored in ai_content table and retrievable
  from Dashboard at any time

- Loading indicator while API call processes

- Plan is permanent — no regeneration option

### 4. Log Expense

**Why fourth:** Without this, Total Money on Hand
never changes and the Dashboard has nothing to show.

Scope:

- Main category: Needs or Wants only

- Subcategory: predefined list plus custom text input

- Amount and optional note fields

- Saves to expenses table and immediately
  subtracts from Total Money on Hand

- Validation on amount and main category

### 5. Log Income Entry

**Why fifth:** Mirror of expense logging — adds to Total Money on Hand.
Required for the weekly AI report to reference any income
received during the period. If no income was logged for
that week, the report generates based on expense data alone.

Scope:

- Source, amount, optional note fields

- Saves to income_entries table and immediately
  adds to Total Money on Hand

- Income screen starts blank after onboarding
  (onboarding entries are separate)

---

## P2 — Core Value (Build after P1 is stable)

### 6. Dashboard Visualizations

**Why here:** First screen an user sees after login.
Weak without real data — build after P1 so it
populates with actual user numbers.

Scope:

- Total Money on Hand displayed as large
  figure at top — computed from opening balance
  plus income and minus expenses

- Savings progress bar showing current balance
  vs goal target amount as a percentage, with goal amount
  displayed at right tail

- Days remaining footer below progress bar

- Spending behavior pie chart using Recharts —
  Needs, Wants, and Savings segments

- Date range filter for pie chart

- All values update automatically when
  expenses or income entries change

### 7. Weekly and Monthly AI Advice Report

**Why here:** The second AI-powered feature and the ongoing
value delivery mechanism of the app.

Requires at least one week of logged expenses
to demonstrate — build after expense logging is stable.

Scope:

- Generate button unlocks on the exact date that marks 
  the end of each weekly period and is automatically 
  disabled again at the end of that same day

- If the user misses the unlock date, the button remains 
  disabled until the next weekly period ends — the report 
  is not generated retroactively and no data accumulates 
  beyond the defined period window

- Locked button displays the next available generation 
  date so the user always knows when to return

- At every four-week mark, the button unlocks for a 
  monthly report instead of a weekly one, following 
  the same single-day availability window

- When unlocked and tapped, Google Gemini API is called with 
  only the previous period's expenses, income entries 
  logged during that period, current Total Money on Hand, 
  savings goal details, and user city and state

- Generated report is stored in the ai_content table 
  and displayed immediately on screen

- Loading indicator shown while the API call processes

---

## P3 — Enhanced Experience (Build only if time allows)

### 8. Expense History

Sortable by date and amount.

Filterable by main category, subcategory,
and amount range.

Edit and delete with automatic
Total Money on Hand recalculation.

### 9. Income History

Same sort and filter pattern as expense history.

Edit and delete with recalculation.

### 10. Savings Goal Screen

View-only display of goal purpose, target amount,
deadline, current balance, and remaining amount.

No editing in v1.0.

### 11. View Initial Plan Screen

Retrieves and displays the saved initial
AI plan from ai_content table.

Accessible from Dashboard icon.

### 12. PWA Configuration

Adds to iPhone home screen.

Fullscreen launch with no browser chrome.

Custom app icon.

### 13. Settings and User Profile

Basic screens — not required for core demo.

Build last if time allows.

---

## Build Order Summary

| Order | Feature | Priority |
|---|---|---|
| 1 | Authentication | P1 |
| 2 | Onboarding | P1 |
| 3 | Initial AI Budgeting Plan | P1 |
| 4 | Log Expense | P1 |
| 5 | Log Income Entry | P1 |
| 6 | Dashboard Visualizations | P2 |
| 7 | Weekly and Monthly AI Report | P2 |
| 8 | Expense History | P3 |
| 9 | Income History | P3 |
| 10 | Savings Goal Screen | P3 |
| 11 | View Initial Plan Screen | P3 |
| 12 | PWA Configuration | P3 |
| 13 | Settings and User Profile | P3 |

---

## General Non-Functional Requirements

- Gemini API responses must return and display within 15 seconds

- App must be fully functional on iPhone running iOS 16 or later

- All user data is scoped to the authenticated user —
  no cross-user data access is possible at the database level

- No sensitive financial credentials are stored —
  the app never connects to banking institutions

- App must load the Dashboard in under 3 seconds
  on a standard mobile connection