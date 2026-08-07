# Deliberate Coaching — Beta Ops Dashboard

Frontend for **P0 / Beta** product metrics (AI quality, stability, activation, journeys, engagement, UX, value).

Repo: [`LuisEdGeek/coaching-dashboard`](https://github.com/LuisEdGeek/coaching-dashboard)

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

Default: **fixture mode** (`VITE_USE_FIXTURES=true`). Sign in with any non-empty password.

## Wire to API later

When `coaching-app-back` exposes admin metrics:

```env
VITE_API_BASE_URL=https://backendcoach.geekvillage.com.mx
VITE_USE_FIXTURES=false
```

Expected contract (not implemented yet): `GET /admin/metrics/overview` → `MetricsSnapshot` (see `src/metrics/types.ts`).

## What this UI does

- Lists every **P0 Beta** metric from the product scorecard
- Shows priority, question, formula source, and **instrumentation status**
- Groups gaps: **Blocked / Partial / SQL ready**

Post-Beta and Scale metrics are intentionally out of scope.
