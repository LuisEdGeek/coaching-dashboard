import { useCallback, useEffect, useMemo, useState } from "react";
import { CategorySection } from "./CategorySection";
import { FlaggedPanel } from "./FlaggedPanel";
import { GapsPanel } from "./GapsPanel";
import { HealthSummary } from "./HealthSummary";
import { RagPanel } from "./RagPanel";
import { UsersPanel } from "./UsersPanel";
import { BetaFunnelPanel } from "./BetaFunnelPanel";
import { CoachingProgressionPanel } from "./CoachingProgressionPanel";
import { CoacheesPanel } from "./CoacheesPanel";
import { FailuresPanel } from "./FailuresPanel";
import { CATEGORY_ORDER, P0_METRICS } from "../metrics/catalog";
import {
  clearSession,
  fetchMetricsSnapshot,
  getStoredToken,
  type DateRangeQuery,
} from "../metrics/api";
import type { MetricsSnapshot } from "../metrics/types";

type Props = {
  onLogout: () => void;
};

type LoadState = "loading" | "ready" | "error";
type Tab = "kpis" | "beta" | "rag" | "flagged" | "users";

const PRESETS: ReadonlyArray<{ label: string; days: number | null }> = [
  { label: "All", days: null },
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

/** HTML date `YYYY-MM-DD` → start/end of that local calendar day (ISO). */
function dayBoundsIso(dateInput: string, endOfDay: boolean): string {
  const [y, m, d] = dateInput.split("-").map(Number);
  if (!y || !m || !d) return new Date(dateInput).toISOString();
  const dt = endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  return dt.toISOString();
}

export function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t === "flagged" || t === "rag" || t === "users" || t === "kpis" || t === "beta") return t;
    } catch {
      /* ignore */
    }
    return "kpis";
  });
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  /**
   * Committed range. Empty = whole Beta for funnel/progression;
   * overview handlers still default to 7d when days omitted.
   */
  const [range, setRange] = useState<DateRangeQuery>({});
  const [snap, setSnap] = useState<MetricsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [betaStuck, setBetaStuck] = useState(false);
  const [betaReloadKey, setBetaReloadKey] = useState(0);
  const [userQueryInput, setUserQueryInput] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserLabel, setSelectedUserLabel] = useState<string | null>(null);

  const activePresetDays = range.days ?? null;
  const showDateFilters = tab === "kpis" || tab === "beta" || tab === "flagged" || tab === "users";
  const showUserFilters = tab === "kpis" || tab === "flagged" || tab === "users";

  const betaRange: DateRangeQuery = useMemo(() => ({ ...range }), [range]);

  const coacheesQuery = useMemo(
    () => ({
      ...(betaStuck ? { stuck: true } : {}),
    }),
    [betaStuck],
  );

  const opsRange: DateRangeQuery = useMemo(
    () => ({
      ...range,
      ...(userQuery.trim().length >= 2 ? { q: userQuery.trim() } : {}),
      ...(selectedUserId ? { userId: selectedUserId } : {}),
    }),
    [range, userQuery, selectedUserId],
  );

  const load = useCallback(() => {
    if (tab !== "kpis") return () => undefined;
    setLoadState("loading");
    setError(null);
    let cancelled = false;

    // Same date (+ optional user) filters as the rest of the ops surface.
    fetchMetricsSnapshot(opsRange)
      .then((s) => {
        if (cancelled) return;
        setSnap(s);
        setLoadState("ready");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoadState("error");
        if (!getStoredToken()) onLogout();
      });

    return () => {
      cancelled = true;
    };
  }, [onLogout, opsRange, tab]);

  useEffect(() => {
    if (tab !== "kpis") {
      // Leaving KPIs mid-fetch used to leave loadState stuck on "loading".
      setLoadState((s) => (s === "loading" ? "ready" : s));
      return;
    }
    return load();
  }, [load, reloadKey, tab]);

  function applyPreset(days: number | null) {
    setFromInput("");
    setToInput("");
    setRange(days == null ? {} : { days });
  }

  function commitCustomDates(from: string, to: string) {
    if (!from || !to || from > to) return;
    setError(null);
    setRange({
      from: dayBoundsIso(from, false),
      to: dayBoundsIso(to, true),
    });
  }

  function applyUserFilter(raw: string, switchToUsers = true) {
    const q = raw.trim();
    if (q.length < 2) return;
    setUserQuery(q);
    setSelectedUserId(null);
    setSelectedUserLabel(null);
    if (switchToUsers) setTab("users");
  }

  const canApplyUser = userQueryInput.trim().length >= 2;

  const visible = useMemo(() => {
    if (filter === "all") return P0_METRICS;
    return P0_METRICS.filter((m) => m.priority === filter);
  }, [filter]);

  const byCategory = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      metrics: visible.filter((m) => m.category === cat),
    })).filter((g) => g.metrics.length > 0);
  }, [visible]);

  const criticalAlerts = useMemo(() => {
    if (!snap) return 0;
    return P0_METRICS.filter((m) => {
      const v = snap.values[m.id];
      return m.priority === "critical" && v?.alert && v.available !== false;
    }).length;
  }, [snap]);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  function handleRetry() {
    setReloadKey((k) => k + 1);
    setBetaReloadKey((k) => k + 1);
  }

  const loading = loadState === "loading" && tab === "kpis";

  const rangeDisplay =
    range.from && fromInput && toInput
      ? `${fromInput} → ${toInput}`
      : (snap?.rangeLabel ?? "No range");

  return (
    <div className="dash">
      <div className="page-atmosphere" aria-hidden />
      <header className="dash-top">
        <div>
          <h1>Deliberate KPIs</h1>
          <p className="dash-sub" aria-live="polite">
            {tab === "kpis"
              ? loading
                ? "Loading live scorecard…"
                : rangeDisplay
              : tab === "beta"
                ? "Beta lifecycle funnel, coachees, and AI failure ops"
                : tab === "rag"
                  ? "Coaching chat and product FAQ are separate knowledge bases"
                  : "Ops panels"}
            {" · live API"}
            {tab === "kpis" && criticalAlerts > 0 ? ` · ${criticalAlerts} critical alerts` : ""}
          </p>
        </div>
        <div className="dash-actions">
          <button type="button" className="ghost" onClick={handleRetry} disabled={loading}>
            Refresh
          </button>
          <button type="button" className="ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dash-tabs" role="tablist" aria-label="Dashboard sections">
        {(
          [
            ["kpis", "KPIs"],
            ["beta", "Beta"],
            ["rag", "Knowledge"],
            ["flagged", "Flagged"],
            ["users", "Users"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            className={tab === id ? "is-active" : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "kpis" ? (
        <>
          {error ? (
            <div className="banner-error" role="alert">
              <p>{error}</p>
              <button type="button" className="ghost banner-error__retry" onClick={handleRetry}>
                Retry
              </button>
            </div>
          ) : null}

          <HealthSummary metrics={P0_METRICS} snap={snap} loading={loading} />
        </>
      ) : null}

      {showDateFilters || showUserFilters ? (
        <div
          className="dash-filters"
          role="group"
          aria-label={showUserFilters && !showDateFilters ? "User filters" : "Date and user filters"}
        >
          {showDateFilters ? (
            <>
              <div className="filter-row" role="group" aria-label="Range presets">
                {PRESETS.map((p) => {
                  const active =
                    !range.from &&
                    (p.days == null
                      ? activePresetDays == null
                      : activePresetDays === p.days);
                  return (
                    <button
                      key={p.label}
                      type="button"
                      aria-pressed={active}
                      className={active ? "is-active" : undefined}
                      onClick={() => applyPreset(p.days)}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <label>
                From
                <input
                  type="date"
                  value={fromInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFromInput(v);
                    commitCustomDates(v, toInput);
                  }}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={toInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setToInput(v);
                    commitCustomDates(fromInput, v);
                  }}
                />
              </label>
            </>
          ) : null}

          {showUserFilters ? (
            <>
              <label>
                User
                <input
                  type="search"
                  placeholder="email, name, or id…"
                  value={userQueryInput}
                  onChange={(e) => setUserQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyUserFilter(userQueryInput);
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className={canApplyUser ? "btn-apply" : "ghost"}
                disabled={!canApplyUser}
                title={
                  canApplyUser
                    ? "Search users and open the Users tab"
                    : "Type at least 2 characters"
                }
                onClick={() => applyUserFilter(userQueryInput)}
              >
                Apply user
              </button>
              {userQuery || selectedUserId ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setUserQueryInput("");
                    setUserQuery("");
                    setSelectedUserId(null);
                    setSelectedUserLabel(null);
                  }}
                >
                  Clear user
                  {selectedUserLabel
                    ? ` (${selectedUserLabel})`
                    : userQuery
                      ? ` (${userQuery})`
                      : ""}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "kpis" ? (
        <>
          <div className="dash-actions dash-actions--secondary">
            <div className="filter-row" role="group" aria-label="Priority filter">
              {(["all", "critical", "high", "medium"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  className={filter === f ? "is-active" : undefined}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {(loading || snap) &&
            byCategory.map(({ cat, metrics }) => (
              <CategorySection
                key={cat}
                title={cat}
                metrics={metrics}
                values={snap?.values ?? {}}
                loading={loading}
              />
            ))}

          {(loading || snap) && <GapsPanel metrics={P0_METRICS} snap={snap} />}

          <footer className="dash-foot">
            <p>
              {P0_METRICS.length} P0 metrics · as of{" "}
              {snap ? new Date(snap.asOf).toLocaleString() : loading ? "loading…" : "—"}
              {" · click a card with data to expand its chart"}
            </p>
          </footer>
        </>
      ) : null}

      {tab === "beta" ? (
        <>
          <BetaFunnelPanel key={`funnel-${betaReloadKey}`} range={betaRange} />
          <CoachingProgressionPanel
            key={`progression-${betaReloadKey}`}
            range={betaRange}
          />
          <CoacheesPanel
            query={coacheesQuery}
            onQueryChange={(patch) => {
              if (patch.stuck != null) setBetaStuck(patch.stuck);
            }}
          />
          <FailuresPanel range={range} />
        </>
      ) : null}

      {tab === "rag" ? <RagPanel /> : null}
      {tab === "flagged" ? <FlaggedPanel range={opsRange} /> : null}
      {tab === "users" ? (
        <UsersPanel
          range={opsRange}
          userQuery={userQuery}
          onPickUser={(u) => {
            setSelectedUserId(u.id);
            setSelectedUserLabel(u.email);
            setUserQueryInput(u.email);
            setUserQuery(u.email);
            setTab("flagged");
          }}
        />
      ) : null}
    </div>
  );
}
