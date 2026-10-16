import { useEffect, useState } from "react";
import {
  fetchCoachingProgression,
  type CoachingProgressionKey,
  type CoachingProgressionResponse,
  type DateRangeQuery,
} from "../metrics/api";
import { HorizontalBarChart } from "./HorizontalBarChart";

type Props = {
  range: DateRangeQuery;
};

const LABELS: Record<CoachingProgressionKey, string> = {
  first_session_completed: "First session completed",
  heart_confirmed: "Heart confirmed",
  first_spark_confirmed: "First Spark confirmed",
  first_pulse_agreed: "First Pulse agreed",
  returned_for_followup: "Returned for follow-up",
  journey_completed: "Journey completed",
};

export function CoachingProgressionPanel({ range }: Props) {
  const [data, setData] = useState<CoachingProgressionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCoachingProgression(range)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load coaching progression");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.days, range.from, range.to, range.include_test]);

  const rows =
    data?.milestones.map((m) => ({
      key: m.key,
      label: LABELS[m.key],
      count: m.count,
    })) ?? [];

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Beta coaching progression</h2>
        <p>
          Cumulative Heart → Spark → Pulse milestones in range
          {data ? ` · ${data.registered.toLocaleString()} registered` : null}.
          {data ? (
            <>
              {" "}
              Last updated {new Date(data.generated_at).toLocaleString()}.
            </>
          ) : null}
        </p>
      </header>

      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p>Loading…</p> : null}

      {!loading && data ? (
        <HorizontalBarChart
          rows={rows}
          scaleMax={data.scale_max}
          ariaLabel="Beta coaching progression bar chart"
        />
      ) : null}
    </section>
  );
}
