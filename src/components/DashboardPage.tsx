import { useCallback, useEffect, useMemo, useState } from "react";
import { CategorySection } from "./CategorySection";
import { FlaggedPanel } from "./FlaggedPanel";
import { GapsPanel } from "./GapsPanel";
import { HealthSummary } from "./HealthSummary";
import { RagPanel } from "./RagPanel";
import { UsersPanel } from "./UsersPanel";
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
type Tab = "kpis" | "rag" | "flagged" | "users";

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

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
  const [tab, setTab] = useState<Tab>("kpis");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  /** Committed range — presets apply immediately; custom dates only on Apply. */
  const [range, setRange] = useState<DateRangeQuery>({ days: 7 });
  const [snap, setSnap] = useState<MetricsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [reloadKey, setReloadKey] = useState(0);

  const activePresetDays = range.days ?? null;

  const load = useCallback(() => {
    if (tab !== "kpis") return () => undefined;
    setLoadState("loading");
    setError(null);
    let cancelled = false;

    fetchMetricsSnapshot(range)
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
  }, [onLogout, range, tab]);

  useEffect(() => {
    return load();
  }, [load, reloadKey]);

  function applyPreset(days: number) {
    setFromInput("");
    setToInput("");
    setRange({ days });
  }

  function applyCustomDates() {
    if (!fromInput || !toInput) return;
    if (fromInput > toInput) {
      setError("From date must be on or before To date");
      return;
    }
    setError(null);
    setRange({
      from: dayBoundsIso(fromInput, false),
      to: dayBoundsIso(toInput, true),
    });
  }

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
  }

  const loading = loadState === "loading" && tab === "kpis";

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
                : (snap?.rangeLabel ?? "No range")
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

      <nav className="dash-tabs" aria-label="Dashboard sections">
        {(
          [
            ["kpis", "KPIs"],
            ["rag", "RAG"],
            ["flagged", "Flagged"],
            ["users", "Users"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "is-active" : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="dash-filters" role="group" aria-label="Date range">
        <div className="filter-row">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              className={
                !range.from && activePresetDays === p.days ? "is-active" : undefined
              }
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label>
          From
          <input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
          />
        </label>
        <label>
          To
          <input type="date" value={toInput} onChange={(e) => setToInput(e.target.value)} />
        </label>
        <button
          type="button"
          className="ghost"
          disabled={!fromInput || !toInput || fromInput > toInput}
          onClick={applyCustomDates}
        >
          Apply dates
        </button>
      </div>

      {tab === "kpis" ? (
        <>
          <div className="dash-actions dash-actions--secondary">
            <div className="filter-row" role="group" aria-label="Priority filter">
              {(["all", "critical", "high", "medium"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={filter === f ? "is-active" : undefined}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="banner-error" role="alert">
              <p>{error}</p>
              <button type="button" className="ghost banner-error__retry" onClick={handleRetry}>
                Retry
              </button>
            </div>
          ) : null}

          <HealthSummary metrics={P0_METRICS} snap={snap} loading={loading} />

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

      {tab === "rag" ? <RagPanel /> : null}
      {tab === "flagged" ? <FlaggedPanel range={range} /> : null}
      {tab === "users" ? <UsersPanel range={range} /> : null}
    </div>
  );
}
