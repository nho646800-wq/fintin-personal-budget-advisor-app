# User Stories

**Project:** FinTin — LLM-Integrated Personal Budget Advisor
**Author:** Hoang Nguyen
**Version:** 3.0
**Date:** 07/12/2026

---

## Overview

This document contains user stories for FinTin v1.0 written in
standard Agile format with Given/When/Then acceptance criteria.
Stories are ordered by the chronological user journey through the
app. Each story traces to a business objective in the BRD and
forms the foundation for functional requirements in the FRD and
test scenarios in UAT.

---

## Key System Rules

The following rules govern core system behavior and apply
across multiple user stories:

- **Total Money on Hand** is calculated as: initial onboarding
  amount + sum of all logged income entries − sum of all logged 
  expense entries. It is displayed as an embedded figure on the 
  Dashboard and recalculates automatically whenever an income 
  or expense entry is created, edited, or deleted.
- **Onboarding income entries** are stored solely for generating
  the one-time initial AI budgeting plan. They do not appear in
  the Income screen and are not referenced anywhere else in the
  app after the plan is generated.
- **The initial AI budgeting plan and savings goal are both
  permanent** after onboarding. Neither can be edited or
  regenerated in v1.0.
- **Income entries logged in the Income screen** are entirely
  separate from onboarding income entries. Creating one
  automatically increases Total Money on Hand by that amount.
- **Savings** in the spending behavior pie chart is the remaining
  Total Money on Hand figure after all expenses are subtracted and 
  incomes are added — it is never a user-selectable expense category.

---

## User Stories

---

### US-001 — Create an Account and Log In

**Story:**
As a college student, I want to create a secure account with my
email, password, and general location so that my financial data
is private, only accessible to me, and the AI can reference
nearby spending alternatives relevant to where I live.

**Acceptance Criteria:**

*AC1 — Successful account creation:*
- **Given** I am a new user on the Sign Up screen
- **When** I enter a valid email address, a password, and my
  city and state, then tap Sign Up
- **Then** my account is created and I am taken to the first
  step of onboarding

*AC2 — Successful login:*
- **Given** I am a returning user on the Log In screen
- **When** I enter my registered email and correct password
  and tap Log In
- **Then** I am authenticated and taken directly to my Dashboard

*AC3 — Unauthenticated access blocked:*
- **Given** I am not logged in
- **When** I attempt to navigate to any screen in the app
- **Then** I am redirected to the Log In screen and cannot
  view or interact with any data

*AC4 — Data isolation between accounts:*
- **Given** two different users have accounts in the app
- **When** each user logs in separately
- **Then** each user sees only their own expense entries, income
  entries, savings goal, and Total Money on Hand — never
  another user's data

> **Design Note:** Location is collected as city and state only
> — not a full street address — to protect user privacy while
> still giving the AI enough geographic context to suggest
> nearby spending alternatives.

---

### US-002 — Complete Onboarding

**Story:**
As a new user, I want to walk through a guided three-step
onboarding process where I input my current money on hand,
set up my expected income entries, and define my savings goal
so that the app has everything it needs to generate my
one-time initial budgeting plan and begin tracking my
progress from day one.

**Acceptance Criteria:**

*AC1 — Step 1: Total Money on Hand input:*
- **Given** I have just created my account
- **When** I reach the first onboarding step
- **Then** I am prompted to enter the total amount of money
  I currently have on hand — combining my bank account balance
  and physical cash, excluding any credit — and the app saves
  this value and advances me to the next step when I tap Continue

*AC2 — Step 2: Income entries for initial plan only:*
- **Given** I am on the second onboarding step
- **When** I add one or more income entries — each with a
  source, expected amount, and expected timing — and tap Continue
- **Then** all entries are saved and I advance to the third step.
  These entries are stored exclusively to provide Claude with
  income context for generating the one-time initial budgeting
  plan. They will not appear in the Income screen and will
  not be referenced anywhere else in the app after
  the plan is generated

*AC3 — Step 3: Savings goal setup:*
- **Given** I am on the third onboarding step
- **When** I select a goal purpose from a dropdown list or
  type a custom purpose, enter a target savings amount,
  set a deadline, and tap Continue
- **Then** the savings goal is saved permanently and I am
  taken to the initial AI budgeting plan screen.
  This goal cannot be changed after onboarding in v1.0

*AC4 — Validation across all steps:*
- **Given** I am on any onboarding step
- **When** I attempt to advance with a required field left empty
- **Then** the app displays a validation error specific to the
  missing field and does not advance to the next step

---

### US-003 — View Initial AI Budgeting Plan

**Story:**
As a new user who has just completed onboarding, I want to
see a personalized initial budgeting plan generated by the AI
so that I know how to allocate my money across needs, wants,
and savings from day one — and I want to be able to revisit
this plan at any time from my Dashboard.

**Acceptance Criteria:**

*AC1 — Plan generated immediately after onboarding:*
- **Given** I have completed all three onboarding steps
- **When** the app generates my initial plan
- **Then** I see a structured budgeting plan screen before
  reaching the Dashboard, with no additional action required
  from me to trigger it

*AC2 — Plan uses 50/30/20 as baseline, adjusted to my data:*
- **Given** the AI is generating my initial plan
- **When** I receive the output
- **Then** the plan uses the 50/30/20 framework in the context of a college 
  student as its baseline — approximately 50% of available funds toward
  needs (essentials like groceries), 30% toward wants (fun like eating out), and 20% 
  toward savings — adjusted based on my actual Total Money on Hand, my onboarding income entries, 
  and my savings goal amount and deadline

*AC3 — Plan outputs specific dollar allocations:*
- **Given** I have a savings goal of $3,000 in 10 months
  and Total Money on Hand of $1,000
- **When** I receive the initial plan
- **Then** the plan specifies how much to allocate to needs,
  wants, and savings in concrete dollar amounts per week and
  per month — not percentages only — and flags if my current
  situation requires a higher savings rate than the standard
  20% to meet my deadline on time

*AC4 — Plan is permanently saved and accessible from Dashboard:*
- **Given** my initial plan has been generated
- **When** I tap the View Initial Plan icon from the Dashboard
  at any point after onboarding
- **Then** I am taken to the same saved plan screen showing
  the identical plan generated at onboarding — it has
  not changed

*AC5 — Plan cannot be regenerated:*
- **Given** I am viewing my saved initial plan
- **When** I view the screen
- **Then** there is no option to regenerate or modify the plan.
  The plan is fixed and serves as the permanent reference
  baseline established at the start of my budgeting journey

*AC6 — Loading state during generation:*
- **Given** the AI plan is being generated immediately
  after onboarding
- **When** the Claude API call is processing
- **Then** the app displays a loading indicator and does not
  show a blank or broken screen

---

### US-004 — View Dashboard

**Story:**
As a college student, I want a Dashboard that shows my current
balance, savings progress, spending behavior breakdown, and
quick access to all app features so that I can understand my
full financial picture at a glance and reach any feature
in one tap.

**Acceptance Criteria:**

*AC1 — Total Money on Hand displayed as embedded figure:*
- **Given** I open the Dashboard
- **When** the screen loads
- **Then** my current Total Money on Hand is displayed as a
  centered, large, prominent dollar figure at the top of the Dashboard
  above the progress bar and all other components — not a navigation icon 
  and does not link to a separate screen

*AC2 — Total Money on Hand recalculates on any change:*
- **Given** I have just logged an expense, created an
  income entry, or edited either
- **When** I go back to view the Dashboard
- **Then** the Total Money on Hand figure immediately reflects
  the updated balance without requiring a manual refresh

*AC3 — Savings progress bar with goal amount and deadline footer:*
- **Given** I have an active savings goal
- **When** I view the Dashboard
- **Then** I see a savings progress bar showing how close my
  current Total Money on Hand is to my savings goal amount,
  with the savings goal dollar amount displayed outside the
  right tail of the bar, and a footer beneath the bar
  displaying the number of days remaining until
  my savings goal deadline

*AC4 — Spending behavior pie chart:*
- **Given** I have logged at least one expense
- **When** I view the Dashboard
- **Then** I see a pie chart dividing my spending into three
  segments: Needs (sum of all needs-category expenses),
  Wants (sum of all wants-category expenses), and Savings
  (Total Money on Hand remainder), with the ability to filter 
  the chart by a selected date range. Income entries are not represented in this chart

*AC5 — All six navigation icons present and functional:*
- **Given** I am on the Dashboard
- **When** I view the screen
- **Then** I can see clearly labeled, tappable icons for
  View Initial Plan, Expense History, Log Expense,
  Income, Savings Goal, and Generate Advice Report — each navigating
  to its respective screen when tapped

*AC6 — Empty state on first Dashboard visit:*
- **Given** I have just completed onboarding, finished viewing the 
  initial plan screen and have no expenses logged yet
- **When** I arrive at the Dashboard for the first time
- **Then** the progress bar shows the % of how close my current 
  Total Money on Hand balance to the savings goal amount at 
  its right tail, the pie chart displays an empty state prompting 
  me to log my first expense, and the Total Money on Hand figure 
  reflects my opening balance confirmed during the onboarding process

---

### US-005 — Log an Expense

**Story:**
As a college student, I want to quickly log an expense with
a main category, subcategory, amount, and optional note so
that my spending is recorded and my Total Money on Hand
decreases immediately to reflect what I actually spent.

**Acceptance Criteria:**

*AC1 — Successful expense log:*
- **Given** I tap the Log Expense icon from the Dashboard
- **When** I select a main category, enter or select a
  subcategory, enter an amount, add an optional note,
  and tap Save
- **Then** the expense is saved, appears in my Expense
  History, and my Total Money on Hand on the Dashboard is
  immediately reduced by that expense amount

*AC2 — Main category is limited to Needs or Wants:*
- **Given** I am on the Log Expense form
- **When** I select a main category
- **Then** only Needs and Wants are available as options —
  Savings does not appear as a selectable main category,
  since savings is the remainder the app calculates
  automatically - Total Money on Hand after all incomes and expenses
  are accounted for, not a spending category the user logs

*AC3 — Subcategory is editable:*
- **Given** I am filling in the subcategory field
- **When** I tap it
- **Then** I can either select from a predefined list of
  common subcategories such as Groceries, Dining, and
  Transport, or type in a custom subcategory of my own

*AC4 — Validation on empty required fields:*
- **Given** I am on the Log Expense form
- **When** I attempt to save with the amount field empty or
  the main category unselected
- **Then** the app displays an error message that says "Please fill in all 
  required fields" and does not save the expense

---

### US-006 — View and Manage Expense History

**Story:**
As a college student, I want to view all my logged expenses
in one place, sort and filter them, and correct any entry I
logged incorrectly so that my expense record stays accurate
and easy to navigate.

**Acceptance Criteria:**

*AC1 — Full expense list displayed:*
- **Given** I tap the Expense History icon from the Dashboard
- **When** I arrive at the Expense History screen
- **Then** I see a list of all logged expenses, each showing
  its main category, subcategory, amount, logged date, and note (if 
  this field was filled out when the expense was first logged)

*AC2 — Sortable by date and amount:*
- **Given** I am viewing my Expense History
- **When** I select a sort option
- **Then** I can sort the list by logged date (latest first or
  oldest first) or by amount (highest first or lowest first)

*AC3 — Filterable by category, subcategory, and amount range:*
- **Given** I am viewing my Expense History
- **When** I apply a filter
- **Then** I can filter the list by main category (Needs or Wants), by a 
  specific subcategory to which at least an expense entry belongs, or by a 
  defined amount range — and the list updates to show only matching 
  entries

*AC4 — Editing an expense recalculates Total Money on Hand:*
- **Given** I tap on a logged expense and update its amount
- **When** I save the change
- **Then** the expense entry is updated and Total Money
  on Hand is recalculated — the original amount is added back
  and the corrected amount is subtracted

*AC5 — Deleting an expense restores Total Money on Hand:*
- **Given** I tap on a logged expense and select Delete
- **When** I confirm the deletion
- **Then** the expense entry is permanently removed and Total
  Money on Hand increases by that expense entry's amount

---

### US-007 — Log and Manage Income Entries

**Story:**
As a college student, I want to log income entries whenever
I receive money in real life so that my Total Money on Hand
increases immediately to reflect what I have actually received,
and I want to manage my income history in one place.

**Acceptance Criteria:**

*AC1 — Income screen is blank after onboarding:*
- **Given** I have just completed onboarding and tap the
  Income icon from the Dashboard
- **When** I arrive at the Income screen for the first time
- **Then** the screen displays an empty state prompting me to
  log my first income entry. The income entries submitted
  during onboarding do not appear here — those inputs were
  used solely to generate the initial AI budgeting plan

*AC2 — Creating an income entry automatically adds
to Total Money on Hand:*
- **Given** I am on the Income screen
- **When** I tap Add Income, fill in the amount, source,
  and an optional note, and tap Save
- **Then** the entry is created with the current date, appears
  in my income list, and Total Money on Hand on the Dashboard
  increases by that amount immediately

*AC3 — Sortable by date and amount:*
- **Given** I have at least one income entry logged
- **When** I select a sort option
- **Then** I can sort the list by date (latest first or
  oldest first) or by amount (highest first or lowest first)

*AC4 — Filterable by source and amount range:*
- **Given** I have at least one income entry logged
- **When** I apply a filter
- **Then** I can filter the list by source or by a defined
  amount range, and the list updates to show only
  matching entries

*AC5 — Editing an income entry recalculates
Total Money on Hand:*
- **Given** I tap on an existing income entry and update
  its amount
- **When** I save the change
- **Then** the entry is updated and Total Money on Hand is
  recalculated — the original amount is subtracted and
  the corrected amount is added

*AC6 — Deleting an income entry reduces Total Money on Hand:*
- **Given** I tap on an income entry and select Delete
- **When** I confirm the deletion
- **Then** the entry is permanently removed and Total Money
  on Hand decreases by that entry's amount

---

### US-008 — View Savings Goal

**Story:**
As a college student, I want to view my savings goal details
in one place so that I always have a clear reference for what
I am working toward and how close I currently am.

**Acceptance Criteria:**

*AC1 — Savings goal details displayed:*
- **Given** I tap the Savings Goal icon from the Dashboard
- **When** I arrive at the Savings Goal screen
- **Then** I see the goal purpose, target amount, deadline,
  current Total Money on Hand, and the remaining amount
  needed to reach the target

*AC2 — Goal is view-only:*
- **Given** I am on the Savings Goal screen
- **When** I view the screen
- **Then** there is no option to edit the goal purpose,
  target amount, or deadline. The savings goal is fixed
  for v1.0 of FinTin

---

### US-009 — Generate Weekly and Monthly AI Advice Reports

**Story:**
As a college student, I want to generate a weekly AI advice
report after each full week of tracking, and a monthly
summary report after every four-week period, so that I receive
specific, actionable spending recommendations based on my
actual logged data — including real, nearby cheaper
alternatives relevant to where I live.

**Acceptance Criteria:**

*AC1 — Report locked before weekly period ends:*
- **Given** the current weekly period has not yet ended
- **When** I tap Generate Report from the Dashboard
- **Then** the app displays the message: "Please wait until
  [end of weekly period date] so Claude can gather enough
  data for your personalized advice" and no API call is made

*AC2 — Weekly report generated after each weekly period:*
- **Given** a full weekly period has passed and it is not
  the end of a four-week cycle
- **When** I tap Generate Report
- **Then** the Claude API is called and a weekly advice
  report is generated and displayed based on the
  previous week's data

*AC3 — Monthly report generated instead of weekly report
at every four-week mark:*
- **Given** four consecutive weekly periods have passed
  since onboarding or since the last monthly report
- **When** I tap Generate Report at the end of that
  fourth week
- **Then** the Claude API is called and a monthly advice
  report is generated based on the fixed savings goal details 
  as well as all expense and income entries logged across 
  the entire previous four weeks — replacing the standard weekly 
  report for that period

*AC4 — Reports reference only the relevant period's data:*
- **Given** a weekly or monthly report is being generated
- **When** the Claude API call is made
- **Then** the report draws only from the permanent savings goal details,
  logged expense data, income entries, and current Total Money on Hand
  relevant to that reporting period. Onboarding income 
  entries are never referenced in any weekly or monthly report
  once the onboarding process is complete

*AC5 — Reports include specific, location-aware
recommendations:*
- **Given** a weekly or monthly report is generated
- **When** I review the advice
- **Then** the report identifies at least one specific
  subcategory or an expense entry where spending can be 
  reduced based on my savings goal timeline, and includes 
  at least one real, specific, nearby alternative option 
  relevant to my city and state — such as a cheaper grocery 
  store or a more affordable dining option in my area

*AC6 — Loading state during generation:*
- **Given** I have triggered a report
- **When** the Claude API call is processing
- **Then** the app displays a loading indicator and does
  not show a blank or broken screen

---

### US-010 — Install App to iPhone Home Screen

**Story:**
As a college student, I want to install FinTin to my iPhone
home screen so that I can open it instantly like any other
app — without opening a browser or typing a URL.

**Acceptance Criteria:**

*AC1 — Installation via Safari:*
- **Given** I visit the FinTin URL in Safari on my iPhone
- **When** I tap the Share button and select Add to Home Screen
- **Then** the app installs with its own icon and the name
  FinTin visible on my home screen

*AC2 — Fullscreen launch after installation:*
- **Given** the app is installed on my iPhone home screen
- **When** I tap the FinTin icon to open it
- **Then** the app launches with no browser address bar or navigation chrome visible

---

## Traceability Summary

| Story ID | Story Title | BRD Objective |
|---|---|---|
| US-001 | Create an Account and Log In | Objective 5 |
| US-002 | Complete Onboarding | Objectives 1, 2, 3 |
| US-003 | View Initial AI Budgeting Plan | Objective 2 |
| US-004 | View Dashboard | Objective 3 |
| US-005 | Log an Expense | Objective 1 |
| US-006 | View and Manage Expense History | Objective 1 |
| US-007 | Log and Manage Income Entries | Objective 1 |
| US-008 | View Savings Goal | Objective 3 |
| US-009 | Generate Weekly and Monthly AI Advice Reports | Objective 4 |
| US-010 | Install App to iPhone Home Screen | Objective 5 |