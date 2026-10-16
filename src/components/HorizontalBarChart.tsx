export type BarRow = {
  key: string;
  label: string;
  count: number;
  /** Optional secondary label (e.g. % of previous). */
  detail?: string;
};

type Props = {
  rows: BarRow[];
  /** X-axis max; defaults to max(count, 1). */
  scaleMax?: number;
  /** Accessible name for the SVG. */
  ariaLabel: string;
};

/** Horizontal bar chart — SVG only, no chart library. */
export function HorizontalBarChart({ rows, scaleMax, ariaLabel }: Props) {
  if (rows.length === 0) {
    return <p className="chart-empty">No points in this range.</p>;
  }

  const max = Math.max(scaleMax ?? 0, ...rows.map((r) => r.count), 1);
  const labelW = 168;
  const valueW = 44;
  const barMaxW = 320;
  const rowH = 36;
  const padTop = 8;
  const padBottom = 28;
  const w = labelW + barMaxW + valueW + 24;
  const h = padTop + rows.length * rowH + padBottom;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div className="hbar-chart">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={ariaLabel}
        className="hbar-chart__svg"
      >
        {ticks.map((t) => {
          const x = labelW + (t / max) * barMaxW;
          return (
            <g key={`tick-${t}`}>
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={h - padBottom}
                className="hbar-chart__grid"
              />
              <text x={x} y={h - 8} textAnchor="middle" className="hbar-chart__tick">
                {t}
              </text>
            </g>
          );
        })}

        {rows.map((row, i) => {
          const y = padTop + i * rowH;
          const barW = Math.max(0, (row.count / max) * barMaxW);
          return (
            <g key={row.key}>
              <text
                x={labelW - 12}
                y={y + 18}
                textAnchor="end"
                className="hbar-chart__label"
              >
                {row.label}
              </text>
              <rect
                x={labelW}
                y={y + 6}
                width={barW}
                height={20}
                rx={10}
                ry={10}
                className="hbar-chart__bar"
              />
              <text
                x={labelW + barW + 8}
                y={y + 20}
                className="hbar-chart__value"
              >
                {row.count.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
      {rows.some((r) => r.detail) ? (
        <ul className="hbar-chart__details">
          {rows.map((r) =>
            r.detail ? (
              <li key={r.key}>
                <span>{r.label}</span>
                <em>{r.detail}</em>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  );
}
