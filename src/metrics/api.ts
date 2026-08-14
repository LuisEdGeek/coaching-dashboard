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
  inputMessage: { id?: string; role: string; content: string } | null;
  outputMessage: { id?: string; role: string; content: string } | null;
  followingMessages: Array<{ id?: string; role: string; content: string }>;
};

export async function fetchFlagged(q: DateRangeQuery) {
  return adminGet<{ from: string; to: string; events: FlaggedEvent[] }>("/admin/ops/flagged", q);
}

export type RagDocument = {
  id: string;
  title: string;
  sourceType?: string;
  source_type?: string;
  status: string;
  createdAt?: string;
  created_at?: string;
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
    throw new Error(`Delete failed (${res.status})`);
  }
}

export function apiBaseConfigured(): boolean {
  return Boolean(API_BASE);
}
