import type { DataStatus, MetricDefinition, MetricValue } from "../metrics/types";

const STATUS_LABEL: Record<DataStatus, string> = {
  live: "Live",
  sql_ready: "SQL ready",
  partial: "Partial",
  blocked: "Blocked",
};

type Props = {
  metric: MetricDefinition;
  value?: MetricValue;
};

export function MetricCard({ metric, value }: Props) {
  const display = value?.display ?? "—";
  const isEmpty = display === "—" || display === "~";

  return (
    <article
      className={`metric-card metric-card--${metric.priority} metric-card--${metric.status}`}
      data-alert={value?.alert ? "true" : undefined}
    >
      <header className="metric-card__head">
        <span className={`status-pill status-pill--${metric.status}`}>
          {STATUS_LABEL[metric.status]}
        </span>
        <span className="metric-card__priority">{metric.priority}</span>
      </header>
      <h3 className="metric-card__name">{metric.name}</h3>
      <p className={`metric-card__value${isEmpty ? " is-empty" : ""}`}>{display}</p>
      {value?.delta ? <p className="metric-card__delta">{value.delta}</p> : null}
      <p className="metric-card__question">{metric.question}</p>
      {metric.gap ? (
        <p className="metric-card__gap">
          <span>Needs</span> {metric.gap}
        </p>
      ) : null}
    </article>
  );
}
