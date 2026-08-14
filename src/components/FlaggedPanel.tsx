import { useEffect, useState } from "react";
import { fetchFlagged, type DateRangeQuery, type FlaggedEvent } from "../metrics/api";

type Props = { range: DateRangeQuery };

export function FlaggedPanel({ range }: Props) {
  const [events, setEvents] = useState<FlaggedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFlagged(range)
      .then((r) => {
        if (!cancelled) setEvents(r.events);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.days, range.from, range.to, range.userId]);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Flagged inputs / outputs</h2>
        <p>
          Sensitive slice only: triggering message, the response at that moment, and the next three
          messages — never the full thread.
        </p>
      </header>

      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p>Loading…</p> : null}
      {!loading && events.length === 0 ? <p className="muted">No flagged events in this range.</p> : null}

      <ul className="flag-list">
        {events.map((ev) => {
          const open = openId === ev.id;
          return (
            <li key={ev.id} className="flag-card">
              <button type="button" className="flag-card__toggle" onClick={() => setOpenId(open ? null : ev.id)}>
                <span className={`flag-kind flag-kind--${ev.kind}`}>{ev.kind}</span>
                <strong>{ev.detector}</strong>
                <span className="muted">{new Date(ev.occurredAt).toLocaleString()}</span>
                {ev.categories.length > 0 ? (
                  <span className="flag-cats">{ev.categories.join(", ")}</span>
                ) : null}
              </button>
              {open ? (
                <div className="flag-card__body">
                  <MsgBlock label="Input (flagged)" msg={ev.inputMessage} />
                  <MsgBlock label="Output at that moment" msg={ev.outputMessage} />
                  <div>
                    <h4>Next 3 messages</h4>
                    {ev.followingMessages.length === 0 ? (
                      <p className="muted">None yet (or hydrate unavailable).</p>
                    ) : (
                      ev.followingMessages.map((m, i) => (
                        <MsgBlock key={m.id ?? i} label={`${m.role}`} msg={m} />
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MsgBlock({
  label,
  msg,
}: {
  label: string;
  msg: { role: string; content: string } | null;
}) {
  if (!msg) return <p className="muted">{label}: —</p>;
  return (
    <div className="msg-block">
      <h4>
        {label} <span className="muted">({msg.role})</span>
      </h4>
      <pre>{msg.content}</pre>
    </div>
  );
}
