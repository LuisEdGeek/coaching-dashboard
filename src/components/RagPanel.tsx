import { useCallback, useEffect, useState } from "react";
import {
  deleteRagDocument,
  fetchRagDocuments,
  ingestRagText,
  uploadRagPdf,
  type RagDocument,
} from "../metrics/api";

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
    if (!confirm("Delete this document from the knowledge base?")) return;
    setBusy(true);
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
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>RAG knowledge</h2>
        <p>Upload PDFs or paste raw text into the shared coaching knowledge base.</p>
      </header>

      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}

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
            placeholder="Paste methodology notes, FAQs, scripts…"
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

      <div className="ops-table-wrap">
        {loading ? <p>Loading documents…</p> : null}
        {!loading && docs.length === 0 ? <p className="muted">No documents yet.</p> : null}
        {docs.length > 0 ? (
          <table className="ops-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.sourceType ?? d.source_type ?? "—"}</td>
                  <td>{d.status}</td>
                  <td>
                    <button type="button" className="ghost" disabled={busy} onClick={() => void onDelete(d.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
