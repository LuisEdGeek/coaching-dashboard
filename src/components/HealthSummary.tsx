import type { MetricDefinition, MetricValue, MetricsSnapshot } from "../metrics/types";

type Props = {
  metrics: MetricDefinition[];
  snap: MetricsSnapshot | null;
  loading: boolean;
};

export function HealthSummary({ metrics, snap, loading }: Props) {
  if (loading) {
    return (
      <section className="health" aria-busy="true" aria-live="polite">
        <div className="health__intro">
          <h2>Beta health</h2>
          <p>Loading live scorecard…</p>
        </div>
        <div className="health__stats" aria-hidden>
          <div className="health__stat is-skeleton" />
          <div className="health__stat is-skeleton" />
          <div className="health__stat is-skeleton" />
        </div>
      </section>
    );
  }

  if (!snap) {
    return (
      <section className="health" aria-live="polite">
        <div className="health__intro">
          <h2>Beta health</h2>
          <p>Scorecard unavailable — retry to load live metrics from the API.</p>
        </div>
      </section>
    );
  }

  let live = 0;
  let alerts = 0;
  let unavailable = 0;
  const alertItems: Array<{ metric: MetricDefinition; value: MetricValue }> = [];

  for (const m of metrics) {
    const v = snap.values[m.id];
    if (!v || v.available === false) {
      unavailable += 1;
      continue;
    }
    live += 1;
    if (v.alert) {
      alerts += 1;
      alertItems.push({ metric: m, value: v });
    }
  }

  const headline =
    alerts > 0
      ? `${live} metrics reporting · ${alerts} alert${alerts === 1 ? "" : "s"} need attention`
      : unavailable === metrics.length
        ? "No live readings in this range yet — check gaps below"
        : `Looking steady — ${live} metrics live, no alerts`;

  return (
    <section className="health" aria-live="polite">
      <div className="health__intro">
        <h2>Beta health</h2>
        <p>{headline}</p>
      </div>
      <div className="health__stats">
        <div className="health__stat">
          <strong>{live}</strong>
          <span>Live</span>
        </div>
        <div className={`health__stat${alerts > 0 ? " is-alert" : ""}`}>
          <strong>{alerts}</strong>
          <span>Alerts</span>
        </div>
        <div className="health__stat">
          <strong>{unavailable}</strong>
          <span>Unavailable</span>
        </div>
      </div>
      {alertItems.length > 0 ? (
        <div className="health__alerts" role="list" aria-label="Active alerts">
          {alertItems.map(({ metric, value }) => (
            <div key={metric.id} className="health__alert" role="listitem">
              <span className="alert-chip">Alert</span>
              <div>
                <strong>{metric.name}</strong>
                <span>
                  {value.display}
                  {value.delta ? ` · ${value.delta}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
