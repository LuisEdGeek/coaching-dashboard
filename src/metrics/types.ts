export type MetricPriority = "critical" | "high" | "medium";

export type MetricCategory =
  | "AI Quality"
  | "Operational Stability"
  | "Activation"
  | "Journey Completion"
  | "Engagement"
  | "UX Clarity"
  | "Value Perception"
  | "User Feedback";

/** How ready the backend/app is to feed this metric. */
export type DataStatus =
  | "live" // can be wired to an admin API today
  | "sql_ready" // tables/logs exist; need aggregate endpoint
  | "partial" // signal exists but incomplete
  | "blocked"; // needs new instrumentation

export type MetricKind = "quantitative" | "qualitative" | "mixed";

export type MetricDefinition = {
  id: string;
  name: string;
  category: MetricCategory;
  priority: MetricPriority;
  kind: MetricKind;
  question: string;
  formula: string;
  source: string;
  status: DataStatus;
  /** What is missing before this is trustworthy in prod. */
  gap?: string;
};

export type MetricValue = {
  id: string;
  /** Display value, e.g. "2.4%", "1.2s", "—" */
  display: string;
  /** Optional sparkline-ish trend label */
  delta?: string;
  /** true = bad direction for critical metrics */
  alert?: boolean;
};

export type MetricsSnapshot = {
  asOf: string;
  rangeLabel: string;
  values: Record<string, MetricValue>;
};
