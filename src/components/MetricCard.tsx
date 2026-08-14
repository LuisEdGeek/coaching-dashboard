import { useState } from "react";
import { LineChart } from "./LineChart";
import type { DataStatus, MetricDefinition, MetricValue } from "../metrics/types";

const STATUS_LABEL: Record<DataStatus, string> = {
  live: "Live",
  sql_ready: "Pipeline ready",
  partial: "Partial",
  blocked: "Not wired",
};

type Props = {
  metric: MetricDefinition;
  value?: MetricValue;
  loading?: boolean;
};

export function MetricCard({ metric, value, loading = false }: Props) {
  const [open, setOpen] = useState(false);
  const available = value?.available;
  const isUnavailable = !loading && (available === false || (!value && !loading));
  const isLive = !loading && available === true;
  const hasSeries = Boolean(value?.series && value.series.length > 0);

  const display = loading
    ? "…"
    : isUnavailable
      ? "Unavailable"
      : (value?.display ?? "—");

  const statusLabel = loading
    ? "Loading"
    : isLive
      ? "Live"
      : isUnavailable
        ? "Unavailable"
        : STATUS_LABEL[metric.status];

  const statusClass = loading
    ? "loading"
    : isLive
      ? "live"
      : isUnavailable
        ? "blocked"
        : metric.status;

  const reason =
    !loading && isUnavailable
      ? value?.delta || metric.gap
      : metric.gap && !isLive
        ? metric.gap
        : null;

  return (
    <article
      className={`metric-card metric-card--${metric.priority} metric-card--${statusClass}${open ? " is-expanded" : ""}`}
      data-alert={value?.alert ? "true" : undefined}
      aria-busy={loading || undefined}
    >
      <button
        type="button"
        className="metric-card__hit"
        onClick={() => hasSeries && setOpen((v) => !v)}
        disabled={!hasSeries}
        aria-expanded={hasSeries ? open : undefined}
      >
        <header className="metric-card__head">
          <span className={`status-pill status-pill--${statusClass}`}>{statusLabel}</span>
          <div className="metric-card__head-right">
            {value?.alert ? <span className="alert-chip">Alert</span> : null}
            <span className="metric-card__priority">{metric.priority}</span>
          </div>
        </header>
        <h3 className="metric-card__name">{metric.name}</h3>
        <p
          className={`metric-card__value${loading || isUnavailable || display === "—" ? " is-empty" : ""}`}
        >
          {display}
        </p>
        {isLive && value?.delta ? <p className="metric-card__delta">{value.delta}</p> : null}
        <p className="metric-card__question">{metric.question}</p>
        {reason ? (
          <p className="metric-card__gap">
            <span>{isUnavailable ? "Why" : "Needs"}</span> {reason}
          </p>
        ) : null}
        {hasSeries ? (
          <p className="metric-card__chart-hint">{open ? "Hide chart" : "Show chart"}</p>
        ) : null}
      </button>
      {open && value?.series ? (
        <div className="metric-card__chart">
          <LineChart series={value.series} />
        </div>
      ) : null}
    </article>
  );
}
