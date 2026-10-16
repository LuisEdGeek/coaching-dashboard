import type { MetricValue, MetricsSnapshot } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  "",
);

export type AuthSession = {
  token: string;
  email: string;
  isAdmin: boolean;
};

export type DateRangeQuery = {
  days?: number;
  from?: string;
  to?: string;
  /** Email / name / id search */
  q?: string;
  userId?: string;
  /** Include QA / demo accounts in beta KPIs (default false). */
  include_test?: boolean;
  /** Coachees only: no session.turn in the last 7 days. */
  stuck?: boolean;
};

const TOKEN_KEY = "dc_dash_token";

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function rangeQuery(q: DateRangeQuery): string {
  const params = new URLSearchParams();
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.days != null && !q.from) params.set("days", String(q.days));
  if (q.q) params.set("q", q.q);
  if (q.userId) params.set("userId", q.userId);
  if (q.include_test) params.set("include_test", "true");
  if (q.stuck) params.set("stuck", "true");
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function adminGet<T>(path: string, q: DateRangeQuery = {}): Promise<T> {
  const token = getStoredToken();
  if (!token) throw new Error("Not signed in");
  if (!API_BASE) throw new Error("VITE_API_BASE_URL is required");

  const res = await fetch(`${API_BASE}${path}${rangeQuery(q)}`, {
    headers: authHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    clearSession();
    throw new Error("Session expired or not admin");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function loginAdmin(email: string, password: string): Promise<AuthSession> {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL is required (no fixtures)");
  }

  const res = await fetch(`${API_BASE}/login-registro/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Login failed (${res.status})`);
  }

  const data = (await res.json()) as {
    session?: { token?: string };
    user?: { email?: string };
    profile?: { isAdmin?: boolean };
  };

  const token = data.session?.token;
  if (!token) {
    throw new Error("Login response missing session token");
  }
  if (!data.profile?.isAdmin) {
    throw new Error("This account is not an admin (profile.isAdmin=false)");
  }

  sessionStorage.setItem(TOKEN_KEY, token);
  return {
    token,
    email: data.user?.email ?? email,
    isAdmin: true,
  };
}

export async function fetchMetricsSnapshot(q: DateRangeQuery = { days: 7 }): Promise<MetricsSnapshot> {
  const raw = await adminGet<MetricsSnapshot & { values: Record<string, MetricValue> }>(
    "/admin/metrics/overview",
    q,
  );
  return raw;
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  isAdmin: boolean;
  subscriptionStatus: string;
  subscriptionPlanKey: string | null;
};

export async function fetchAdminUsers(q: DateRangeQuery) {
  return adminGet<{ from: string; to: string; users: AdminUserRow[] }>("/admin/ops/users", q);
}

export type FlaggedEvent = {
  id: string;
  eventId: string;
  occurredAt: string;
  userId: string | null;
  sessionId: string | null;
  kind: string;
  detector: string;
  categories: string[];
  category: string | null;
  riskLevel: string | null;
  matchType: string | null;
  responseRule: string | null;
  inputMessage: { id?: string; role: string; content: string } | null;
  outputMessage: { id?: string; role: string; content: string } | null;
  followingMessages: Array<{ id?: string; role: string; content: string }>;
};

export async function fetchFlagged(q: DateRangeQuery) {
  return adminGet<{ from: string; to: string; events: FlaggedEvent[] }>("/admin/ops/flagged", q);
}

export type GuardrailsCatalogKeyword = { text: string; precision: "hard" | "candidate" };

export type GuardrailsCatalogCategory = {
  id: string;
  name: string;
  layer: string;
  excelRisk: string;
  action: string;
  outputAction: string | null;
  keywords: GuardrailsCatalogKeyword[];
  phrases: string[];
};

export type GuardrailsCatalog = {
  version: string;
  source: string;
  ruleANumbers: string[];
  responseRules: Array<{ item: string; appliesTo: string; instruction: string }>;
  categories: GuardrailsCatalogCategory[];
};

export async function fetchGuardrailsCatalog() {
  return adminGet<GuardrailsCatalog>("/admin/ops/guardrails-catalog");
}

export type RagDocument = {
  id: string;
  title: string;
  sourceType?: string;
  source_type?: string;
  status: string;
  createdAt?: string;
  created_at?: string;
  /** `coaching` (chat) or `faq` (product help). */
  corpus?: string;
  metadata?: Record<string, unknown> | null;
};

export async function fetchRagDocuments() {
  return adminGet<{ documents: RagDocument[] }>("/admin/ops/rag/documents");
}

export async function ingestRagText(title: string, text: string) {
  const token = getStoredToken();
  if (!token || !API_BASE) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/admin/ops/rag/documents/text`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ title, text }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function uploadRagPdf(file: File, title?: string) {
  const token = getStoredToken();
  if (!token || !API_BASE) throw new Error("Not signed in");
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  const res = await fetch(`${API_BASE}/admin/ops/rag/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
    throw new Error(body?.message ?? body?.error ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function deleteRagDocument(id: string) {
  const token = getStoredToken();
  if (!token || !API_BASE) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/admin/ops/rag/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) {
    const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new Error(body?.error ?? body?.message ?? `Delete failed (${res.status})`);
  }
}

export function apiBaseConfigured(): boolean {
  return Boolean(API_BASE);
}

export type FunnelStageKey =
  | "registered"
  | "verified"
  | "onboarding"
  | "first_session_started"
  | "first_session_completed";

export type FunnelStageRow = {
  key: FunnelStageKey;
  count: number;
  pct_of_previous: number;
};

export type FunnelResponse = {
  from: string;
  to: string;
  include_test: boolean;
  stages: FunnelStageRow[];
  generated_at: string;
};

export async function fetchFunnel(q: DateRangeQuery = { days: 7 }): Promise<FunnelResponse> {
  return adminGet<FunnelResponse>("/admin/metrics/funnel", q);
}

export type CoachingProgressionKey =
  | "first_session_completed"
  | "heart_confirmed"
  | "first_spark_confirmed"
  | "first_pulse_agreed"
  | "returned_for_followup"
  | "journey_completed";

export type CoachingProgressionResponse = {
  from: string;
  to: string;
  include_test: boolean;
  registered: number;
  scale_max: number;
  milestones: Array<{ key: CoachingProgressionKey; count: number }>;
  generated_at: string;
};

export async function fetchCoachingProgression(
  q: DateRangeQuery = { days: 7 },
): Promise<CoachingProgressionResponse> {
  return adminGet<CoachingProgressionResponse>("/admin/metrics/coaching-progression", q);
}

export type CoacheeStage =
  | "Not started"
  | "Exploring Heart"
  | "Heart confirmed"
  | "Exploring Spark"
  | "Spark confirmed"
  | "Pulse agreed";

export type CoacheeRow = {
  id: string;
  registered: boolean;
  verified: boolean;
  onboarding: boolean;
  stage: CoacheeStage;
  last_activity_at: string | null;
  is_test_account: boolean;
};

export type CoacheesResponse = {
  include_test: boolean;
  stuck: boolean;
  coachees: CoacheeRow[];
  generated_at: string;
};

export async function fetchCoachees(
  q: Pick<DateRangeQuery, "include_test" | "stuck"> = {},
): Promise<CoacheesResponse> {
  return adminGet<CoacheesResponse>("/admin/coachees", q);
}

export async function patchCoacheeTestAccount(
  id: string,
  is_test_account: boolean,
): Promise<{ id: string; is_test_account: boolean }> {
  const token = getStoredToken();
  if (!token || !API_BASE) throw new Error("Not signed in");

  const res = await fetch(
    `${API_BASE}/admin/coachees/${encodeURIComponent(id)}/test-account`,
    {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ is_test_account }),
    },
  );
  if (res.status === 401 || res.status === 403) {
    clearSession();
    throw new Error("Session expired or not admin");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${res.status}`);
  }
  return res.json() as Promise<{ id: string; is_test_account: boolean }>;
}

export async function downloadCoacheesCsv(
  q: Pick<DateRangeQuery, "include_test" | "stuck"> = {},
): Promise<Blob> {
  const token = getStoredToken();
  if (!token || !API_BASE) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}/admin/coachees/csv${rangeQuery(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) {
    clearSession();
    throw new Error("Session expired or not admin");
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => ""));
    throw new Error(body || `API ${res.status}`);
  }
  return res.blob();
}

export type FailureKindMetrics = {
  total: number;
  daily: Array<{ t: string; v: number }>;
  recent_session_ids: string[];
};

export type FailuresResponse = {
  from: string;
  to: string;
  turn_failed: FailureKindMetrics;
  persist_failed: FailureKindMetrics;
  generated_at: string;
};

export async function fetchFailures(q: DateRangeQuery = { days: 7 }): Promise<FailuresResponse> {
  return adminGet<FailuresResponse>("/admin/metrics/failures", q);
}
