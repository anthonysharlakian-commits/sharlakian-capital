# Sharlakian Holdings OS

AI-powered real estate investment platform — a closed-loop autonomous system that finds, underwrites, acquires, manages, and compounds real estate investments.

## Architecture

```
INTAKE → UNDERWRITE → DECISION → ACQUIRE → OPERATE → COMPOUND → (repeat)
```

Every phase except **DECISION** runs autonomously via AI agents. Anthony (system ops) approves or rejects deals via the Deal Command Center.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **AI:** Anthropic Claude (claude-sonnet-4-6)
- **Background Jobs:** Inngest
- **Comms:** Twilio SMS
- **Payments:** Stripe
- **Charts:** Recharts
- **Deploy:** Vercel

## Quick Start

### Prerequisites

- Node.js 18+ (installed via `winget install OpenJS.NodeJS.LTS`)
- Supabase project (for live data)
- Anthropic API key (for AI agents)

### Setup

```bash
cd C:\Users\antho\Projects\sharlakian-holdings-os
npm install          # already done
npm run setup        # checks .env.local and prints next steps
npm run dev          # http://localhost:3000
npm run build        # production build (verified ✓)
```

Fill in `.env.local` with your API keys. The app runs in **mock/demo mode** without Supabase keys.

### Database

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open **SQL Editor** and run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql` (optional demo data)
   - `supabase/migrations/003_dashboard_schema.sql` (dashboard tables + live KPI support)
3. Copy **Project URL**, **anon key**, and **service role key** into `.env.local`
4. Enable Email auth in Supabase → Authentication → Providers
5. Set Site URL to `http://localhost:3000` and redirect URL to `http://localhost:3000/auth/callback`

### Auth

When Supabase keys are configured, middleware protects all routes except `/login`, `/auth/*`, and webhooks. Without keys, the app skips auth and runs in demo mode.

### Demo Mode Features

Without API keys, the app still works fully:

- **Persistent mock data** — approve/reject, settings, and maintenance requests save to `.data/mock-store.json`
- **Rule-based agents** — deal scanner and maintenance router work without Claude API
- **Demo banner** — shows at top of dashboard when in demo mode

Run agents manually:
```bash
curl -X POST http://localhost:3000/api/agents/deal-scanner
curl -X POST http://localhost:3000/api/agents/refi-monitor
curl -X POST http://localhost:3000/api/agents/orchestrator -H "Content-Type: application/json" -d "{\"agent\":\"deal_scanner\"}"
```

## Key Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Portfolio overview — live KPIs, cash flow, deal pipeline |
| `/` | Redirects to `/dashboard` |
| `/deals` | Deal Command Center — kanban pipeline |
| `/deals/[id]` | Deal detail + approve/reject |
| `/properties` | Owned and pipeline properties |
| `/agents` | Agent registry and activity log |
| `/settings` | Acquisition criteria configuration |

## AI Agents

| Agent | Schedule | Trigger |
|---|---|---|
| Deal Scanner | Every 6 hours | Cron |
| Underwriter | Event-driven | After scan qualifies |
| Maintenance Router | Event-driven | On request submission |
| Refi Monitor | Monthly (1st, 9am) | Cron |
| Financial Reporter | Monthly (1st, 8am) | Cron |
| Tenant Screener | Event-driven | On application |

Manual trigger: `POST /api/agents/orchestrator` with `{ "agent": "deal_scanner" }`

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add all env vars from `.env.example`
4. Connect Inngest via `/api/inngest`
5. Configure Twilio webhook to `/api/webhooks/twilio`
6. Configure Stripe webhook to `/api/webhooks/stripe`

## Environment Variables

See `.env.example` for the full list.
