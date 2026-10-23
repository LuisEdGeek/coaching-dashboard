import { useEffect, useState } from "react";
import {
  fetchFunnel,
  type DateRangeQuery,
  type FunnelResponse,
  type FunnelStageKey,
} from "../metrics/api";
import { HorizontalBarChart } from "./HorizontalBarChart";

type Props = {
  range: DateRangeQuery;
};

const STAGE_LABELS: Record<FunnelStageKey, string> = {
  registered: "Registered",
  verified: "Verified",
  onboarding: "Onboarding complete",
  first_session_started: "First session started",
  first_session_completed: "First session completed",
};

export function BetaFunnelPanel({ range }: Props) {
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFunnel(range)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load funnel");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.days, range.from, range.to]);

  const rows =
    data?.stages.map((stage) => ({
      key: stage.key,
      label: STAGE_LABELS[stage.key],
      count: stage.count,
      detail:
        stage.key === "registered"
          ? undefined
          : `${stage.pct_of_previous.toFixed(1)}% of previous`,
    })) ?? [];

  const scaleMax = Math.max(...rows.map((r) => r.count), 1);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Beta lifecycle funnel</h2>
        <p>
          Each bar counts how many people in this group ever reached that step.
          Notes under bars are % of the previous step.
          {data ? (
            <>
              {" "}
              Last updated {new Date(data.generated_at).toLocaleString()}.
            </>
          ) : null}
        </p>
        {data?.cohort_line ? <p className="ops-panel__cohort">{data.cohort_line}</p> : null}
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
          scaleMax={scaleMax}
          ariaLabel="Beta lifecycle funnel bar chart"
        />
      ) : null}
    </section>
  );
}
