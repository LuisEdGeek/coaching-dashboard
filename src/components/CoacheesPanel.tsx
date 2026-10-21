import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadCoacheesCsv,
  fetchCoachees,
  patchCoacheeTestAccount,
  type CoacheeRow,
  type DateRangeQuery,
} from "../metrics/api";

type Props = {
  query: Pick<DateRangeQuery, "include_test" | "stuck">;
  onQueryChange: (patch: Partial<Pick<DateRangeQuery, "include_test" | "stuck">>) => void;
};

type SortKey =
  | "email"
  | "registered"
  | "verified"
  | "onboarding"
  | "stage"
  | "last_activity_at"
  | "is_test_account";

function cmpBool(a: boolean, b: boolean): number {
  return Number(a) - Number(b);
}

function cmpStr(a: string | null, b: string | null): number {
  return (a ?? "").localeCompare(b ?? "");
}

function displayEmail(row: CoacheeRow): string {
  const email = (row.email ?? "").trim();
  return email || row.id;
}

export function CoacheesPanel({ query, onQueryChange }: Props) {
  const [rows, setRows] = useState<CoacheeRow[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("last_activity_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [csvBusy, setCsvBusy] = useState(false);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchCoachees(query)
      .then((r) => {
        setRows(r.coachees);
        setGeneratedAt(r.generated_at);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load coachees");
      })
      .finally(() => setLoading(false));
  }, [query.include_test, query.stuck]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let c = 0;
      switch (sortKey) {
        case "email":
          c = displayEmail(a).localeCompare(displayEmail(b));
          break;
        case "registered":
          c = cmpBool(a.registered, b.registered);
          break;
        case "verified":
          c = cmpBool(a.verified, b.verified);
          break;
        case "onboarding":
          c = cmpBool(a.onboarding, b.onboarding);
          break;
        case "stage":
          c = a.stage.localeCompare(b.stage);
          break;
        case "last_activity_at":
          c = cmpStr(a.last_activity_at, b.last_activity_at);
          break;
        case "is_test_account":
          c = cmpBool(a.is_test_account, b.is_test_account);
          break;
      }
      return c * dir;
    });
    return list;
  }, [rows, sortDir, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "email" || key === "stage" ? "asc" : "desc");
    }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  async function handleExportCsv() {
    setCsvBusy(true);
    setError(null);
    try {
      const blob = await downloadCoacheesCsv(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "coachees.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "CSV export failed");
    } finally {
      setCsvBusy(false);
    }
  }

  async function toggleTest(row: CoacheeRow) {
    const next = !row.is_test_account;
    setPatchingId(row.id);
    setError(null);
    try {
      await patchCoacheeTestAccount(row.id, next);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, is_test_account: next } : r)),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPatchingId(null);
    }
  }

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Coachees</h2>
        <p>
          Stuck = no session activity in 7 days.
          {generatedAt ? (
            <>
              {" "}
              Last updated {new Date(generatedAt).toLocaleString()}.
            </>
          ) : null}
        </p>
      </header>

      <div className="filter-row" role="group" aria-label="Coachee filters">
        <label className="filter-check">
          <input
            type="checkbox"
            checked={Boolean(query.include_test)}
            onChange={(e) => onQueryChange({ include_test: e.target.checked })}
          />
          Include test accounts
        </label>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={Boolean(query.stuck)}
            onChange={(e) => onQueryChange({ stuck: e.target.checked })}
          />
          Stuck only (7d)
        </label>
        <button type="button" className="ghost" disabled={csvBusy} onClick={() => void handleExportCsv()}>
          {csvBusy ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p>Loading…</p> : null}
      {!loading && sorted.length === 0 ? <p className="muted">No coachees match.</p> : null}

      {sorted.length > 0 ? (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("email")}>
                    Email{sortIndicator("email")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("registered")}>
                    Registered{sortIndicator("registered")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("verified")}>
                    Verified{sortIndicator("verified")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("onboarding")}>
                    Onboarding{sortIndicator("onboarding")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("stage")}>
                    Stage{sortIndicator("stage")}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => toggleSort("last_activity_at")}
                  >
                    Last activity{sortIndicator("last_activity_at")}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => toggleSort("is_test_account")}
                  >
                    Test{sortIndicator("is_test_account")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.id}>
                  <td>{displayEmail(row)}</td>
                  <td>{row.registered ? "yes" : "no"}</td>
                  <td>{row.verified ? "yes" : "no"}</td>
                  <td>{row.onboarding ? "yes" : "no"}</td>
                  <td>{row.stage}</td>
                  <td>
                    {row.last_activity_at
                      ? new Date(row.last_activity_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ghost"
                      disabled={patchingId === row.id}
                      aria-pressed={row.is_test_account}
                      onClick={() => void toggleTest(row)}
                    >
                      {row.is_test_account ? "test" : "live"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
