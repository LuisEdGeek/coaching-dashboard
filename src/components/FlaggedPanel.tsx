import { useEffect, useMemo, useState } from "react";
import {
  fetchFlagged,
  fetchGuardrailsCatalog,
  type DateRangeQuery,
  type FlaggedEvent,
  type GuardrailsCatalog,
  type GuardrailsCatalogCategory,
} from "../metrics/api";

type Props = { range: DateRangeQuery };

export function FlaggedPanel({ range }: Props) {
  const [events, setEvents] = useState<FlaggedEvent[]>([]);
  const [catalog, setCatalog] = useState<GuardrailsCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | "input" | "output">("all");
  const [ruleFilter, setRuleFilter] = useState<"all" | "A" | "B" | "flag_only">("all");
  const [openCatalogId, setOpenCatalogId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchFlagged(range), fetchGuardrailsCatalog().catch(() => null)])
      .then(([flagged, cat]) => {
        if (cancelled) return;
        setEvents(flagged.events);
        setCatalog(cat);
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

  const visible = useMemo(() => {
    return events.filter((ev) => {
      if (kindFilter !== "all" && ev.kind !== kindFilter) return false;
      if (ruleFilter !== "all" && ev.responseRule !== ruleFilter) return false;
      return true;
    });
  }, [events, kindFilter, ruleFilter]);

  const groupedCatalog = useMemo(() => {
    if (!catalog) return [];
    const layers = ["input", "security", "output"] as const;
    return layers
      .map((layer) => ({
        layer,
        categories: catalog.categories.filter((c) => c.layer === layer),
      }))
      .filter((g) => g.categories.length > 0);
  }, [catalog]);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Flagged inputs / outputs</h2>
        <p>
          Sensitive slice only: triggering message, the response at that moment, and the next three
          messages — never the full thread. Events are stored in ops so you can come back to them.
        </p>
      </header>

      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="filter-row" role="group" aria-label="Flag filters">
        {(["all", "input", "output"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kindFilter === k}
            className={kindFilter === k ? "is-active" : undefined}
            onClick={() => setKindFilter(k)}
          >
            {k}
          </button>
        ))}
        {(["all", "A", "B", "flag_only"] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={ruleFilter === r}
            className={ruleFilter === r ? "is-active" : undefined}
            onClick={() => setRuleFilter(r)}
          >
            {r === "all" ? "all rules" : r === "flag_only" ? "flag only" : `Rule ${r}`}
          </button>
        ))}
      </div>

      {loading ? <p>Loading…</p> : null}
      {!loading && visible.length === 0 ? <p className="muted">No flagged events in this range.</p> : null}

      <ul className="flag-list">
        {visible.map((ev) => {
          const open = openId === ev.id;
          return (
            <li key={ev.id} className="flag-card">
              <button
                type="button"
                className="flag-card__toggle"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : ev.id)}
              >
                <span className={`flag-kind flag-kind--${ev.kind}`}>{ev.kind}</span>
                {ev.responseRule ? (
                  <span className="flag-kind">{ev.responseRule === "flag_only" ? "flag" : `Rule ${ev.responseRule}`}</span>
                ) : null}
                <strong>{ev.category ?? ev.detector}</strong>
                <span className="muted">{new Date(ev.occurredAt).toLocaleString()}</span>
                <span className="flag-cats">
                  {[ev.detector, ev.matchType, ev.riskLevel, ...ev.categories.slice(0, 3)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
              {open ? (
                <div className="flag-card__body">
                  <MsgBlock label="Input (flagged)" msg={ev.inputMessage} />
                  <MsgBlock label="Output at that moment" msg={ev.outputMessage} />
                  <div>
                    <h4>Next 3 messages</h4>
                    {ev.followingMessages.length === 0 ? (
                      <p className="muted">No later messages in this session (or hydrate unavailable).</p>
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

      <header className="ops-panel__head" style={{ marginTop: 28 }}>
        <h3>Guardrail catalog</h3>
        <p>
          {catalog
            ? `${catalog.version} · ${catalog.categories.length} categories. Read-only — edit the JSON and redeploy to change rules.`
            : "Catalog unavailable (LLM proxy not configured)."}
        </p>
      </header>

      {groupedCatalog.map((group) => (
        <div key={group.layer} className="catalog-layer">
          <h4 className="catalog-layer__title">{group.layer}</h4>
          <ul className="flag-list">
            {group.categories.map((c) => (
              <CatalogRow
                key={c.id}
                category={c}
                open={openCatalogId === c.id}
                onToggle={() => setOpenCatalogId(openCatalogId === c.id ? null : c.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function CatalogRow({
  category,
  open,
  onToggle,
}: {
  category: GuardrailsCatalogCategory;
  open: boolean;
  onToggle: () => void;
}) {
  const hard = category.keywords.filter((k) => k.precision === "hard").map((k) => k.text);
  const candidate = category.keywords.filter((k) => k.precision === "candidate").map((k) => k.text);
  return (
    <li className="flag-card">
      <button type="button" className="flag-card__toggle" aria-expanded={open} onClick={onToggle}>
        <span className="flag-kind">{category.action}</span>
        <strong>{category.name}</strong>
        <span className="muted">{category.excelRisk}</span>
        <span className="flag-cats">
          {category.keywords.length} keywords · {category.phrases.length} phrases
        </span>
      </button>
      {open ? (
        <div className="flag-card__body">
          {hard.length > 0 ? (
            <p>
              <strong>Hard keywords:</strong> {hard.join(", ")}
            </p>
          ) : null}
          {candidate.length > 0 ? (
            <p>
              <strong>Candidate keywords:</strong> {candidate.join(", ")}
            </p>
          ) : null}
          {category.phrases.length > 0 ? (
            <p>
              <strong>Example phrases:</strong> {category.phrases.slice(0, 8).join(" · ")}
              {category.phrases.length > 8 ? ` · +${category.phrases.length - 8} more` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
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
