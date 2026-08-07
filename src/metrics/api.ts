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

export async function fetchMetricsSnapshot(days = 7): Promise<MetricsSnapshot> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not signed in");
  }
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL is required");
  }

  const res = await fetch(`${API_BASE}/admin/metrics/overview?days=${days}`, {
    headers: authHeaders(token),
  });

  if (res.status === 401 || res.status === 403) {
    clearSession();
    throw new Error("Session expired or not admin");
  }
  if (!res.ok) {
    throw new Error(`Metrics API ${res.status}`);
  }

  const raw = (await res.json()) as MetricsSnapshot & {
    values: Record<string, MetricValue & { available?: boolean }>;
  };
  return raw;
}

export function apiBaseConfigured(): boolean {
  return Boolean(API_BASE);
}
