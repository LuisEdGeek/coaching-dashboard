import type { MetricsSnapshot } from "./types";

/**
 * Fixture snapshot for UI development.
 * Values marked alert=true are intentionally “red” so Critical row is obvious.
 * Real wiring: replace via fetchMetrics() when VITE_USE_FIXTURES=false.
 */
export const FIXTURE_SNAPSHOT: MetricsSnapshot = {
  asOf: new Date().toISOString(),
  rangeLabel: "Last 7 days (fixtures)",
  values: {
    unsafe_flagged_outputs: {
      id: "unsafe_flagged_outputs",
      display: "3",
      delta: "+1 vs prior week",
      alert: true,
    },
    app_crashes: { id: "app_crashes", display: "—" },
    ai_latency: {
      id: "ai_latency",
      display: "2.4s p50",
      delta: "p95 6.1s",
    },
    payment_failure_rate: {
      id: "payment_failure_rate",
      display: "4.2%",
      delta: "7 / 167 attempts",
      alert: true,
    },
    safeguarding_escalations: {
      id: "safeguarding_escalations",
      display: "1",
      delta: "review queue",
      alert: true,
    },
    onboarding_completion: {
      id: "onboarding_completion",
      display: "68%",
      delta: "142 / 209",
    },
    first_session_completion: {
      id: "first_session_completion",
      display: "54%",
      delta: "91 / 168",
    },
    full_journey_completion: {
      id: "full_journey_completion",
      display: "12%",
      delta: "proxy only",
    },
    dropoff_by_stage: {
      id: "dropoff_by_stage",
      display: "Heart 31%",
      delta: "Spark 22% · Pulse 18%",
    },
    session_abandonment: { id: "session_abandonment", display: "—" },
    sessions_per_user: {
      id: "sessions_per_user",
      display: "2.1",
      delta: "active users",
    },
    return_d1_d7: { id: "return_d1_d7", display: "—" },
    repeat_sessions: {
      id: "repeat_sessions",
      display: "47",
      delta: "users with 2+ completed",
    },
    ai_thumbs: { id: "ai_thumbs", display: "—" },
    did_this_help: {
      id: "did_this_help",
      display: "4.1 / 5",
      delta: "n=23 (if wired)",
    },
    broken_repetitive: {
      id: "broken_repetitive",
      display: "—",
      delta: "no report channel",
    },
    confusion_points: { id: "confusion_points", display: "—" },
    ux_themes: {
      id: "ux_themes",
      display: "Clarity only",
      delta: "no tagged themes",
    },
    login_failures: {
      id: "login_failures",
      display: "~",
      delta: "no audit log",
    },
    uptime: {
      id: "uptime",
      display: "99.2%",
      delta: "probe /health (manual)",
    },
    would_use_again: { id: "would_use_again", display: "—" },
    perceived_value: { id: "perceived_value", display: "—" },
    questionnaire_feedback: {
      id: "questionnaire_feedback",
      display: "209",
      delta: "initial forms",
    },
    signups: { id: "signups", display: "248", delta: "+31 this week" },
    verification_success: {
      id: "verification_success",
      display: "81%",
      delta: "emailVerified / signups",
    },
    time_to_first_session: {
      id: "time_to_first_session",
      display: "1.8d",
      delta: "median",
    },
    avg_session_length: { id: "avg_session_length", display: "—" },
    support_requests: {
      id: "support_requests",
      display: "6",
      delta: "support shells",
    },
    willingness_to_pay: {
      id: "willingness_to_pay",
      display: "—",
      delta: "use paid conversion proxy",
    },
  },
};
