import { MetricCard } from "./MetricCard";
import type { MetricDefinition, MetricValue } from "../metrics/types";

type Props = {
  title: string;
  metrics: MetricDefinition[];
  values: Record<string, MetricValue>;
};

export function CategorySection({ title, metrics, values }: Props) {
  if (metrics.length === 0) return null;
  return (
    <section className="category">
      <div className="category__head">
        <h2>{title}</h2>
        <span>{metrics.length} metrics</span>
      </div>
      <div className="metric-grid">
        {metrics.map((m) => (
          <MetricCard key={m.id} metric={m} value={values[m.id]} />
        ))}
      </div>
    </section>
  );
}
