# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Deliberate Coaching **ops / admins** (`profile.isAdmin`) monitoring beta health.

Also: **stakeholders** who need a readable scorecard of product KPIs (not day-to-day coaching work).

Not for: end coaches or coachees in the consumer app.

## Product Purpose

**Deliberate KPIs** — beta ops / business analytics dashboard for Deliberate Coaching.

It surfaces P0 / Beta metrics from `coaching-app-back` (`GET /admin/metrics/overview`) so the team can see what is healthy, what is alerting, and where instrumentation is still incomplete (gaps).

Success: stakeholders and ops can answer “how is beta doing?” quickly, expand the metric set over time, and never lose existing scorecard items.

## Positioning

A live **admin scorecard** tied to the real coaching backend — not a marketing site, not a coach-facing product UI, and not fixture theater. Cards reflect API truth (or explicit gaps when data is not ready).

## Operating Context

- Sign-in with admin credentials against `coaching-app-back`.
- Priority filter (all / critical / high / medium).
- Gaps panel for blocked / partial / SQL-ready metrics.
- Category sections of metric cards with status pills, values, deltas, and “needs” copy.
- Env: `VITE_API_BASE_URL` → backend API.

## Capabilities and Constraints

- **Must keep** all existing P0 metrics in the catalog; may **add** more, must **not remove** current ones.
- Current metric set is intentionally **minimal**; expansion is expected.
- Auth: Bearer session; non-admin accounts rejected.
- No fake fixtures as the source of truth for live values.
- Stack (existing): Vite + React + TypeScript; plain CSS tokens in `src/styles.css`.

## Brand Commitments

- Product name in UI: **Deliberate KPIs** / Deliberate Coaching.
- Visual direction confirmed: **Warm Ops Atelier** (warm paper, violet + yellow atmosphere — see DESIGN.md).

## Evidence on Hand

- Metric definitions and gap notes: `coaching-dashboard/src/metrics/catalog.ts`
- Live API client: `coaching-dashboard/src/metrics/api.ts`
- Screens: `LoginPage`, `DashboardPage`, `GapsPanel`, `MetricCard`, `CategorySection`
- Do not invent testimonials, revenue claims, or metrics that are not in the catalog / API.

## Product Principles

1. **Truth over theater** — show live data or an honest gap, never decorative fake KPIs.
2. **Expand, don’t erase** — grow the scorecard; preserve existing P0 metrics.
3. **Ops + stakeholders** — scannable for power users, legible for non-engineering readers.
4. **Warm clarity** — serious monitoring without a cold “enterprise gray” control room.
5. **Beta-first** — prioritize P0 / Beta health signals over vanity charts.

## Accessibility & Inclusion

Keyboard-usable filters and forms; status must not rely on color alone (pills + labels). No stricter WCAG commitment recorded yet — treat AA contrast as a default bar for future work.
