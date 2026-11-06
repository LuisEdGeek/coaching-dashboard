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

export type DataStatus =
  | "live"
  | "sql_ready"
  | "partial"
  | "blocked";

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
  gap?: string;
  /** Plain-language “how this number is made” for the expanded card. */
  howItWorks: string;
};

export type MetricValue = {
  id: string;
  display: string;
  delta?: string;
  alert?: boolean;
  available?: boolean;
  series?: Array<{ t: string; v: number }>;
  /** Optional split (e.g. iOS / Android / Unknown) shown as bars in the detail. */
  breakdown?: Array<{ key: string; label: string; count: number; pct: string }>;
};

export type MetricsSnapshot = {
  asOf: string;
  rangeLabel: string;
  from?: string;
  to?: string;
  values: Record<string, MetricValue>;
};
