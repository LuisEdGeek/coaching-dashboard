import { useEffect, useMemo, useState } from "react";
import { CategorySection } from "./CategorySection";
import { GapsPanel } from "./GapsPanel";
import { CATEGORY_ORDER, P0_METRICS } from "../metrics/catalog";
import { fetchMetricsSnapshot, isFixtureMode, logoutAdmin } from "../metrics/api";
import type { MetricsSnapshot } from "../metrics/types";

type Props = {
  onLogout: () => void;
};

export function DashboardPage({ onLogout }: Props) {
  const [snap, setSnap] = useState<MetricsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");

  useEffect(() => {
    let cancelled = false;
    fetchMetricsSnapshot()
      .then((s) => {
        if (!cancelled) setSnap(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    return P0_METRICS.filter(
      (m) => m.priority === "critical" && snap.values[m.id]?.alert,
    ).length;
  }, [snap]);

  function handleLogout() {
    logoutAdmin();
    onLogout();
  }

  return (
    <div className="dash">
      <div className="page-atmosphere" aria-hidden />
      <header className="dash-top">
        <div>
          <p className="brand-mark">Deliberate Coaching</p>
          <h1>P0 Beta scorecard</h1>
          <p className="dash-sub">
            {snap?.rangeLabel ?? "Loading…"}
            {isFixtureMode() ? " · fixture data" : " · live API"}
            {criticalAlerts > 0 ? ` · ${criticalAlerts} critical alerts` : ""}
          </p>
        </div>
        <div className="dash-actions">
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
          <button type="button" className="ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {error ? <p className="banner-error">{error}</p> : null}

      <GapsPanel metrics={P0_METRICS} />

      {byCategory.map(({ cat, metrics }) => (
        <CategorySection
          key={cat}
          title={cat}
          metrics={metrics}
          values={snap?.values ?? {}}
        />
      ))}

      <footer className="dash-foot">
        <p>
          {P0_METRICS.length} P0 metrics · as of{" "}
          {snap ? new Date(snap.asOf).toLocaleString() : "—"}
        </p>
      </footer>
    </div>
  );
}
