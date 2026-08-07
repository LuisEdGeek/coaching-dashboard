import { FIXTURE_SNAPSHOT } from "./fixtures";
import type { MetricsSnapshot } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  "",
);
const USE_FIXTURES = String(import.meta.env.VITE_USE_FIXTURES ?? "true") !== "false";

export function isFixtureMode(): boolean {
  return USE_FIXTURES || !API_BASE;
}

/**
 * Future: GET /admin/metrics/overview on coaching-app-back.
 * Today that route does not exist — fixtures keep the UI honest about gaps.
 */
export async function fetchMetricsSnapshot(): Promise<MetricsSnapshot> {
  if (isFixtureMode()) {
    return { ...FIXTURE_SNAPSHOT, asOf: new Date().toISOString() };
  }

  const res = await fetch(`${API_BASE}/admin/metrics/overview`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Metrics API ${res.status}`);
  }
  return (await res.json()) as MetricsSnapshot;
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  if (isFixtureMode()) {
    if (!email.trim() || !password.trim()) {
      throw new Error("Email and password required");
    }
    sessionStorage.setItem("dc_dash_demo", "1");
    return;
  }

  const res = await fetch(`${API_BASE}/login-registro/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
}

export function logoutAdmin(): void {
  sessionStorage.removeItem("dc_dash_demo");
}

export function isDemoLoggedIn(): boolean {
  return sessionStorage.getItem("dc_dash_demo") === "1";
}
