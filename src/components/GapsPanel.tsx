import { useMemo, useState } from "react";
import type { MetricDefinition, MetricsSnapshot } from "../metrics/types";

type Props = {
  metrics: MetricDefinition[];
  snap: MetricsSnapshot | null;
};

type GapRow = {
  id: string;
  name: string;
  reason: string;
  bucket: "unavailable" | "instrumentation";
};

/**
 * Secondary backlog: API-unavailable readings + catalog notes still open.
 * Not the primary ops answer — HealthSummary owns that.
 */
export function GapsPanel({ metrics, snap }: Props) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const out: GapRow[] = [];
    for (const m of metrics) {
      const v = snap?.values[m.id];
      if (v && v.available === false) {
        out.push({
          id: m.id,
          name: m.name,
          reason: v.delta || m.gap || "No reading from the API for this range",
          bucket: "unavailable",
        });
        continue;
      }
      if (v?.available === true) continue;
      if (m.gap && (m.status === "blocked" || m.status === "partial")) {
        out.push({
          id: m.id,
          name: m.name,
          reason: m.gap,
          bucket: "instrumentation",
        });
      }
    }
    return out;
  }, [metrics, snap]);

  const unavailable = rows.filter((r) => r.bucket === "unavailable");
  const instrumentation = rows.filter((r) => r.bucket === "instrumentation");

  return (
    <section className="gaps gaps--secondary" aria-label="Instrumentation and unavailable metrics">
      <button
        type="button"
        className="gaps__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="gaps__intro">
          <h2>Gaps &amp; unavailable</h2>
          <p>
            Live numbers come from <code>GET /admin/metrics/overview</code>. This section lists
            metrics with no reading yet, plus remaining product instrumentation notes — not demo
            fixtures.
          </p>
        </div>
        <span className="gaps__toggle-meta">
          {unavailable.length} unavailable · {instrumentation.length} notes · {open ? "Hide" : "Show"}
        </span>
      </button>

      {open ? (
        <div className="gaps__cols">
          <div>
            <h3>
              No reading <em>{unavailable.length}</em>
            </h3>
            {unavailable.length === 0 ? (
              <p className="gaps__empty">All catalog metrics returned a value in this range.</p>
            ) : (
              <ul>
                {unavailable.map((r) => (
                  <li key={r.id}>
                    <strong>{r.name}</strong>
                    <span>{r.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3>
              Still to build <em>{instrumentation.length}</em>
            </h3>
            {instrumentation.length === 0 ? (
              <p className="gaps__empty">No extra catalog notes beyond API unavailability.</p>
            ) : (
              <ul>
                {instrumentation.map((r) => (
                  <li key={r.id}>
                    <strong>{r.name}</strong>
                    <span>{r.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
