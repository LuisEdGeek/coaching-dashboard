import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteRagDocument,
  fetchRagDocuments,
  ingestRagText,
  uploadRagPdf,
  type RagDocument,
} from "../metrics/api";

function metaCorpus(d: RagDocument): string | null {
  if (typeof d.corpus === "string" && d.corpus.trim()) return d.corpus;
  const meta = d.metadata;
  if (meta && typeof meta === "object") {
    const c = (meta as { corpus?: unknown }).corpus;
    if (typeof c === "string" && c.trim()) return c;
  }
  return null;
}

/** Shared product KB only — never per-user memory / onboarding. */
function isSharedProductDoc(d: RagDocument): boolean {
  const corpus = metaCorpus(d);
  if (corpus === "user") return false;
  if ((d as { userId?: string | null }).userId) return false;
  return true;
}

function docCorpus(d: RagDocument): "coaching" | "faq" {
  const corpus = metaCorpus(d);
  if (corpus === "faq") return "faq";
  // ponytail: older list payloads omit corpus; Product FAQ title is unique. Drop when all docs have metadata.corpus.
  if (/product faq/i.test(d.title ?? "")) return "faq";
  return "coaching";
}

function DocTable({
  docs,
  busy,
  onDelete,
  emptyLabel,
  allowDelete,
}: {
  docs: RagDocument[];
  busy: boolean;
  onDelete: (id: string) => void;
  emptyLabel: string;
  allowDelete: boolean;
}) {
  if (docs.length === 0) return <p className="muted">{emptyLabel}</p>;
  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            {allowDelete ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.sourceType ?? d.source_type ?? "—"}</td>
              <td>{d.status}</td>
              {allowDelete ? (
                <td>
                  <button type="button" className="ghost" disabled={busy} onClick={() => onDelete(d.id)}>
                    Delete
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RagPanel() {
  const [docs, setDocs] = useState<RagDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRagDocuments()
      .then((r) => setDocs(r.documents ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sharedDocs = useMemo(() => docs.filter(isSharedProductDoc), [docs]);
  const coachingDocs = useMemo(
    () => sharedDocs.filter((d) => docCorpus(d) === "coaching"),
    [sharedDocs],
  );
  const faqDocs = useMemo(() => sharedDocs.filter((d) => docCorpus(d) === "faq"), [sharedDocs]);

  async function onIngestText(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await ingestRagText(title.trim(), text.trim());
      setTitle("");
      setText("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUploadPdf(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadRagPdf(file, title.trim() || undefined);
      setTitle("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document from the coaching chat knowledge base?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteRagDocument(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="ops-panel" aria-labelledby="rag-coaching-heading">
        <header className="ops-panel__head">
          <h2 id="rag-coaching-heading">
            Coaching chat
            {!loading ? <span className="ops-rag-count"> {coachingDocs.length}</span> : null}
          </h2>
          <p>
            Methodology the coach pulls during a session. Uploads land here only. Product FAQ is never
            mixed into this search.
          </p>
        </header>

        <form className="ops-form" onSubmit={onIngestText}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={500} />
          </label>
          <label>
            Raw text
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              required
              placeholder="Paste methodology notes, handbook excerpts, scripts…"
            />
          </label>
          <div className="ops-form__actions">
            <button type="submit" disabled={busy}>
              Ingest text
            </button>
            <label className="file-btn">
              Upload PDF
              <input
                type="file"
                accept="application/pdf"
                hidden
                disabled={busy}
                onChange={(e) => void onUploadPdf(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </form>

        {loading ? <p>Loading documents…</p> : null}
        {!loading ? (
          <DocTable
            docs={coachingDocs}
            busy={busy}
            onDelete={(id) => void onDelete(id)}
            emptyLabel="No coaching documents yet."
            allowDelete
          />
        ) : null}
      </section>

      <section className="ops-panel" aria-labelledby="rag-faq-heading">
        <header className="ops-panel__head">
          <h2 id="rag-faq-heading">
            Product FAQ
            {!loading ? <span className="ops-rag-count"> {faqDocs.length}</span> : null}
          </h2>
          <p>
            Used only by in-app help. Auto-built when the LLM service starts. Not used in coaching
            chat, and not editable here.
          </p>
        </header>

        {loading ? <p>Loading documents…</p> : null}
        {!loading ? (
          <DocTable
            docs={faqDocs}
            busy={busy}
            onDelete={() => undefined}
            emptyLabel="FAQ corpus not loaded yet (check LLM boot logs)."
            allowDelete={false}
          />
        ) : null}
      </section>
    </>
  );
}
