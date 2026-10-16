import { useEffect, useState } from "react";
import {
  fetchFunnel,
  type DateRangeQuery,
  type FunnelResponse,
  type FunnelStageKey,
} from "../metrics/api";

type Props = {
  range: DateRangeQuery;
};

const STAGE_LABELS: Record<FunnelStageKey, string> = {
  invited: "Invited",
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
  }, [range.days, range.from, range.to, range.include_test]);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Beta lifecycle funnel</h2>
        <p>
          Stage counts in the selected range. Each % is relative to the previous stage (first stage
          is 100%).
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
        <div className="health__stats funnel-stats" role="list">
          {data.stages.map((stage) => (
            <div key={stage.key} className="health__stat" role="listitem">
              <strong>{stage.count.toLocaleString()}</strong>
              <span>{STAGE_LABELS[stage.key]}</span>
              <em className="funnel-stats__pct">
                {stage.key === "invited"
                  ? "—"
                  : `${stage.pct_of_previous.toFixed(1)}% of prev`}
              </em>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
