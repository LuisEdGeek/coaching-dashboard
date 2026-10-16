import { useEffect, useMemo, useState } from "react";
import {
  fetchFailures,
  type DateRangeQuery,
  type FailuresResponse,
} from "../metrics/api";

type Props = {
  range: DateRangeQuery;
};

function mergeDaily(
  turn: Array<{ t: string; v: number }>,
  persist: Array<{ t: string; v: number }>,
): Array<{ day: string; turn: number; persist: number }> {
  const map = new Map<string, { turn: number; persist: number }>();
  for (const row of turn) {
    map.set(row.t, { turn: row.v, persist: map.get(row.t)?.persist ?? 0 });
  }
  for (const row of persist) {
    const prev = map.get(row.t) ?? { turn: 0, persist: 0 };
    map.set(row.t, { turn: prev.turn, persist: row.v });
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }));
}

export function FailuresPanel({ range }: Props) {
  const [data, setData] = useState<FailuresResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFailures(range)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load failures");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.days, range.from, range.to]);

  const daily = useMemo(() => {
    if (!data) return [];
    return mergeDaily(data.turn_failed.daily, data.persist_failed.daily);
  }, [data]);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>AI failures / save failures</h2>
        <p>
          Server-side <code>turn.failed</code> and <code>persist.failed</code> ops events in range.
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
        <>
          <div className="health__stats" style={{ marginBottom: 16 }}>
            <div className="health__stat is-alert">
              <strong>{data.turn_failed.total}</strong>
              <span>AI turn failures</span>
            </div>
            <div className="health__stat is-alert">
              <strong>{data.persist_failed.total}</strong>
              <span>Save failures</span>
            </div>
          </div>

          {daily.length === 0 ? (
            <p className="muted">No failures recorded in this range.</p>
          ) : (
            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Turn failed</th>
                    <th>Persist failed</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row) => (
                    <tr key={row.day}>
                      <td>{row.day}</td>
                      <td>{row.turn}</td>
                      <td>{row.persist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="failures-sessions">
            <div>
              <h3>Recent turn.failed session IDs</h3>
              {data.turn_failed.recent_session_ids.length === 0 ? (
                <p className="muted">None in range.</p>
              ) : (
                <ul className="failures-sessions__list">
                  {data.turn_failed.recent_session_ids.map((id) => (
                    <li key={id}>
                      <code>{id}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3>Recent persist.failed session IDs</h3>
              {data.persist_failed.recent_session_ids.length === 0 ? (
                <p className="muted">None in range.</p>
              ) : (
                <ul className="failures-sessions__list">
                  {data.persist_failed.recent_session_ids.map((id) => (
                    <li key={id}>
                      <code>{id}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
