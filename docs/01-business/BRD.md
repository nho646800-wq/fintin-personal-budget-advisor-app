# Business Requirements Document (BRD)

**Project:** Fintin — LLM-Integrated Personal Budget Advisor
**Author:** Hoang Nguyen
**Version:** 1.0
**Date:** July 2026
**Status:** Final

---

## 1. Problem Statement

College students face a uniquely difficult financial position 
throughout their academic years: irregular income, no established 
financial history, and expenses that fluctuate week to week based 
on coursework demands (textbooks, printing, supplies), social 
obligations (dining out, events), and unpredictable costs (a sudden 
illness mid-winter that requires medication while classes resume 
the following morning). Most students manage money reactively — 
checking their bank balance when anxiety strikes rather than 
tracking spending proactively with full awareness of where they stand.

The core problem is not willpower or financial ignorance. It is that 
no affordable, accessible tool exists that simultaneously meets all 
three of the following conditions for a college student:

- Lightweight enough to use daily on a phone without friction
- Intelligent enough to give advice based on the student's *actual* 
  spending — not generic, FAQ-style tips
- Goal-oriented enough to tie daily spending decisions to a concrete 
  savings target

As a Boilermaker who began college in August 2025, this problem was not 
abstract to me. I had assumed budgeting was straightforward: estimate 
monthly income, build a mental spending plan, subtract actual 
transactions at month's end, and reflect on the gap. What I discovered 
was the opposite. I routinely spent on things I would only recognize 
as unnecessary after the fact, had no real-time visibility into my 
progress toward any savings goal, and was repeatedly blind to cheaper 
alternatives — better grocery substitutes, lower-cost options — that 
would have changed my behavior had I known about them before the 
purchase, not after.

---

## 2. Target Users

**Primary User:** College students aged 18–24 managing personal 
finances independently, often for the first time.

**User Profile:**

- Income is irregular — inconsistent part-time employment, parental 
  allowance transfers that vary in both timing and amount, unexpected 
  scholarships, or internship stipends
- Expenses span a wide range of categories including rent, groceries, 
  subscriptions, dining, transportation, and school supplies — with 
  the specific mix varying by individual, institution, and background
- Smartphone-proficient and app-reliant for academic, social, and 
  professional routines, but quick to abandon tools with steep learning 
  curves or subscription costs that do not deliver immediate, 
  personalized value
- Carries short-term savings goals — a car, a trip, a new laptop — 
  with no structured plan or timeline to reach them
- Does not have a personal financial advisor and cannot afford one

**Secondary User:** 
The developer (Hoang Nguyen) as the primary daily user, 
providing direct real-world feedback for iteration.

---

## 3. Business Objectives

Each objective follows the SMART framework
(Specific, Measurable, Achievable, Relevant, Time-bound).

| # | Objective | Metric | Timeline |
|---|---|---|---|
| 1 | Enable fast daily expense logging so users can capture transactions in real time by amount and category | User can log a transaction in under 60 seconds | By Day 26 |
| 2 | Deliver a personalized AI savings plan at onboarding so users can control spending from day one rather than scrambling to cut costs at month's end | User receives a full savings breakdown within 2 minutes of entering income and goal | By Day 23 |
| 3 | Visualize spending and savings progress so users can make informed decisions before a transaction occurs, not only after | Dashboard displays savings progress and category spending breakdowns with clear visual indicators | By Day 21 |
| 4 | Provide weekly AI-generated expense reduction advice grounded in the user's inputs of their actual spendings | AI report references real transaction data — never generic recommendations disconnected from what the user actually spent | By Day 23 |
| 5 | Deploy as a PWA so users access the app from their iPhone home screen without browser friction | App installs to iPhone home screen and is fully functional on mobile | By Day 26 |

---

## 4. Success Metrics

The project is considered successful at completion if all of 
the following are true:

- A new user can log their first transaction within 60 seconds 
  of opening the app with no prior instructions
- A user can set a savings goal and receive a complete AI savings 
  plan within 2 minutes through the onboarding flow
- Every weekly AI advice report references only the user's actual 
  logged spending categories — it never produces generic 
  recommendations such as "spend less on dining" or "avoid nights 
  out" without first confirming those categories exist in the 
  user's transaction history
- All 4 core screens (Dashboard, Add Transaction, Goals, AI Advice) 
  are functional and load smoothly on an iPhone
- Zero critical bugs remain open after UAT

---

## 5. Competitive Landscape

| Tool | Why It Fails College Students |
|---|---|
| **Mint** | Shut down January 2024. Required bank account connection, which many students are uncomfortable with. No AI-driven advice. |
| **Emma** | Free tier is severely restricted, while paid tiers require evaluating multiple subscription levels before committing. More critically, Emma actively promotes investments, cashback offers, and loan products within the budgeting interface — features that push additional financial commitments rather than the disciplined saving a college student actually needs. Push notifications consistently surface deals and subscription upsells rather than spending alerts tied to the user's own budget. |
| **Chase** | Functions as a transaction ledger rather than a budgeting tool. It surfaces historical spending with auto-assigned categories that are frequently imprecise, but provides no forward-looking guidance on how to adjust behavior in the following period based on those patterns. For a student who already banks with Chase, the built-in budgeting features are a passive record of what already happened — not an active guide for what to do next. |
| **YNAB (You Need A Budget)** | $14.99/month — too expensive for the typical college student. Built for people with stable, predictable income. Carries a steep learning curve with a proprietary budgeting methodology that takes weeks to understand before delivering value. |
| **Copilot** | $13/month, iOS only, requires bank account connection. No pairing of savings goals with personalized AI advice. |
| **Spreadsheets (Excel/Google Sheets)** | No AI, no mobile UX, no automation, and no notifications. Requires time-consuming manual setup to personalize and the sustained discipline to maintain it — something most students do not keep up. Pre-built templates are rarely free and still require significant configuration to reflect an individual's actual spending situation. |
| **Generic AI (ChatGPT, Claude.ai)** | Not connected to the user's actual spending data. Advice is generic because the model has no context. No persistent tracking between sessions. |

**The Gap:** No existing free tool combines straightforward manual 
transaction tracking, savings goal management, and AI advice 
personalized to the user's real spending data — without requiring 
access to sensitive banking credentials — in a lightweight, 
mobile-first experience.

---

## 6. Proposed Solution

**Fintin** is a mobile-first Progressive Web App that allows 
college students to:

1. Set a savings goal with a defined purpose, target amount, 
   and deadline
2. Log daily income and expenses by category in under 60 seconds
3. Receive an AI-generated overview budgeting plan based on the popular 
   50/30/20 method by default (spending allowance %'s for 3 primary expenditure 
   categories are still editable later on) right after onboarding
4. Request AI-generated advices on a weekly basis that reads their 
   actual accumulated spending data and produces a specific, personalized 
   plan — including how much to save per month, which categories to cut, 
   by how much, and which alternative substitutes (such as grocery 
   retailers and specific food ingredients) to consider

The AI advisory layer is powered by the Anthropic Claude API. 
The app passes the user's entered income, spending by category, 
and savings goal directly into a structured prompt. Claude returns 
specific, contextual advice — not generic financial tips 
disconnected from the user's reality.

The app requires no bank account connection, charges no subscription 
fee, and installs directly to the user's iPhone home screen as 
a Progressive Web App.

---

## 7. Solution Scope

### In Scope (Version 1.0)
- Manual income entry
- Manual expense entry with editable category tagging
- Spending summary by category on a dashboard
- Savings goal setup: user selects a goal type, enters a target 
  amount, and sets a deadline
- Visual savings progress indicator and spending behavior 
  visualizations
- Weekly AI advice report generation powered by the Claude API
- Mobile-responsive UI installable as a PWA

### Out of Scope (Future Versions)
- Bank account or credit card integration (e.g., Plaid API)
- AI-generated savings goal creation — a future mode where the 
  user describes a goal in natural language and the AI infers 
  the target amount, timeline, and plan based on given income 
  and income sources automatically
- Investment or portfolio tracking
- Bill payment reminders or automation
- Multi-user or shared budget features
- Native iOS or Android app (App Store distribution)
- Recurring transaction automation

---

## 8. Assumptions

- The user knows their rough monthly or yearly income figures 
  and primary income sources
- The user is willing to enter transactions manually rather 
  than connect a bank account
- The user has an iPhone with Safari or Chrome installed
- The Anthropic Claude API remains available and within free 
  or low-cost usage limits for a single-user application
- Supabase free tier is sufficient for one user's data volume
- Vercel free tier is sufficient for deployment

---

## 9. Constraints

| Constraint | Detail |
|---|---|
| **Time** | 30 days at a maximum of 1.5 hours per day, due to an active externship running concurrently throughout the build period |
| **Team** | Solo BA and developer, assisted by Cursor AI — no role handoff |
| **Budget** | $0 — all tools must operate within free tiers (Supabase, Vercel, Figma) |
| **Infrastructure** | No bank API integration — connecting to financial institutions introduces compliance and security complexity outside this project's scope |

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Claude API changes pricing or rate limits | Low | High | Monitor usage; cost at single-user scale is minimal under pay-per-use pricing |
| Feature creep extends timeline | Medium | High | Strict MoSCoW prioritization enforced in FRD; all out-of-scope items deferred |
| Supabase free tier limitations | Low | Medium | Single-user data volume is minimal; free tier is sufficient |
| Time constraint causes incomplete build | Medium | Medium | Core AI feature (Days 22–23) is prioritized; UI polish is deferrable |