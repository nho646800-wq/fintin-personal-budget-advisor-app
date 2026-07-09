# FinTin Budget Advisor App

> An LLM-integrated personal finance Progressive Web App that helps college students track income, expenses, and work towards their savings goals — with measurable progress and weekly personalized advice from an integrated LLM (Claude API by Anthropic).

**Live Demo:** [Link coming after deployment]  

**Built by:** Hoang Nguyen — Business Analytics & Information Management, Purdue University

---

## The Problem

[Fill this in on Day 29. 2–3 sentences. 

Example direction: College students lack lightweight, AI-assisted tools 

that give personalized budgeting advice based on their actual spending — 

not generic tips designed for people with stable incomes.]

## The Solution

[Fill this in on Day 29. 2–3 sentences describing what the app does 

and how the AI integration specifically addresses the problem.]

---



## Project Documentation

This app was built following a full BA delivery process — 

from business case through UAT — before any implementation steps began.

| Document | Description |
|---|---|
| [Business Requirements (BRD)](docs/01-business/[BRD.md](http://BRD.md)) | Why this app exists — primary sections: problem statement, objectives (follow the SMART structure), target users, success metrics, competitive landscape, solution scope, constraints |
| [Functional Requirements (FRD)](docs/02-requirements/[FRD.md](http://FRD.md)) | What functions the app must perform — primary sections: feature specs, MoSCoW prioritization, AI behavior specification |
| [User Stories](docs/02-requirements/[user-stories.md](http://user-stories.md)) | Agile-style user stories with acceptance criteria follow a Given/When/Then structure |
| [AS-IS Process Map](docs/03-process-models/AS-IS-college-budget-process.png) | How college students manage budgets today and the current pain points of this process that this app addresses |
| [TO-BE Process Map](docs/03-process-models/TO-BE-app-budget-process.png) | The improved process enabled by the app through bridging the gaps that the AS-IS process created at first |
| [Context Diagram (DFD L0)](docs/03-process-models/DFD-L0-context-diagram.png) | System-level view of data inputs, outputs, and external entities |
| [System Processes (DFD L1)](docs/03-process-models/DFD-L1-system-processes.png) | Internal breakdown of the app's core data flows |
| [Entity Relationship Diagram](docs/04-data-design/ERD.png) | Database schema — entities, attributes, and relationships |
| [Wireframes](docs/05-ux-design/wireframes/) | UI mockups for all 4 core screens, designed in Figma |
| [Figma File](docs/05-ux-design/[figma-link.md](http://figma-link.md)) | Full interactive prototype |
| [UAT Test Cases](docs/06-testing/[UAT-test-cases.md](http://UAT-test-cases.md)) | Acceptance test scenarios based on user stories |
| [AI Prompt Template](prompts/[ai-advisor-prompt-template.md](http://ai-advisor-prompt-template.md)) | Prompt engineering logic with its design rationale |

---



## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | UI + mobile-friendly PWA |
| Database | Supabase (PostgreSQL) | storage of user data (transactions, goals, etc.) |
| AI | Anthropic Claude API | Personalized budgeting advice |
| Hosting | Vercel | Deployment + CI from GitHub |
| Design | Figma | Wireframes and UI mockups |
| Diagramming | Lucidchart, [dbdiagram.io](http://dbdiagram.io) | Process models and ERD |

---



## App Screenshots

*Added after Day 26 — once deployment and mobile testing complete.*

---



## Live Demo

*Vercel link added after Day 15.*

---



## What I Learned

*Will be written on Day 29 — covering prompt engineering, LLM API integration, 

translating BA documentation into a working product, and the difference 

between AI integration and AI agency.*

---



## Project Timeline

FinTin was built in 30 days following a discovery → design → build → test delivery sequence.