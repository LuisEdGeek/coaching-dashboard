import type { MetricDefinition } from "../metrics/types";

type Props = {
  metrics: MetricDefinition[];
};

export function GapsPanel({ metrics }: Props) {
  const blocked = metrics.filter((m) => m.status === "blocked");
  const partial = metrics.filter((m) => m.status === "partial");
  const sqlReady = metrics.filter((m) => m.status === "sql_ready");

  return (
    <section className="gaps" aria-label="Instrumentation gaps">
      <div className="gaps__intro">
        <h2>What we still need</h2>
        <p>
          This board is the P0 Beta scorecard. Cards show fixtures until{" "}
          <code>/admin/metrics/*</code> exists on <code>coaching-app-back</code>.
        </p>
      </div>
      <div className="gaps__cols">
        <div>
          <h3>
            Blocked <em>{blocked.length}</em>
          </h3>
          <ul>
            {blocked.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>
                <span>{m.gap}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>
            Partial <em>{partial.length}</em>
          </h3>
          <ul>
            {partial.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>
                <span>{m.gap}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>
            SQL ready <em>{sqlReady.length}</em>
          </h3>
          <ul>
            {sqlReady.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>
                <span>{m.gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
