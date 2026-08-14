type Point = { t: string; v: number };

type Props = {
  series: Point[];
  height?: number;
};

/** Minimal SVG line chart — no chart library. */
export function LineChart({ series, height = 120 }: Props) {
  if (series.length === 0) {
    return <p className="chart-empty">No points in this range.</p>;
  }

  const w = 320;
  const h = height;
  const pad = 8;
  const values = series.map((p) => p.v);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;

  const pts = series.map((p, i) => {
    const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((p.v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend over time">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pts.join(" ")}
        />
      </svg>
      <div className="line-chart__labels">
        <span>{series[0]?.t}</span>
        <span>{series[series.length - 1]?.t}</span>
      </div>
    </div>
  );
}
