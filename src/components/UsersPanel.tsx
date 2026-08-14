import { useEffect, useMemo, useState } from "react";
import { fetchAdminUsers, type AdminUserRow, type DateRangeQuery } from "../metrics/api";

type Props = {
  range: DateRangeQuery;
  /** Shared search from the top filter bar */
  userQuery: string;
  onPickUser?: (user: AdminUserRow) => void;
};

export function UsersPanel({ range, userQuery, onPickUser }: Props) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [localQ, setLocalQ] = useState("");

  const effectiveQ = (userQuery.trim() || localQ.trim() || undefined);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    setLoading(true);
    setError(null);

    const run = () => {
      const q: DateRangeQuery = {
        ...range,
        ...(effectiveQ && effectiveQ.length >= 2 ? { q: effectiveQ } : {}),
      };
      fetchAdminUsers(q)
        .then((r) => {
          if (!cancelled) setUsers(r.users);
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    // Debounce search so typing doesn't leave the panel stuck on Loading…
    if (effectiveQ && effectiveQ.length >= 2) {
      timer = window.setTimeout(run, 300);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [range.days, range.from, range.to, range.userId, effectiveQ]);

  const statuses = useMemo(() => {
    const s = new Set(users.map((u) => u.subscriptionStatus));
    return ["all", ...Array.from(s).sort()];
  }, [users]);

  const plans = useMemo(() => {
    const s = new Set(
      users.map((u) => u.subscriptionPlanKey).filter((p): p is string => Boolean(p)),
    );
    return ["all", ...Array.from(s).sort()];
  }, [users]);

  const visible = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== "all" && u.subscriptionStatus !== statusFilter) return false;
      if (planFilter !== "all" && u.subscriptionPlanKey !== planFilter) return false;
      return true;
    });
  }, [users, statusFilter, planFilter]);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Users</h2>
        <p>
          {effectiveQ && effectiveQ.length >= 2
            ? `Search “${effectiveQ}” across all accounts (max 500).`
            : "Accounts created in the selected date range (max 500). Search by email to find anyone."}
        </p>
      </header>

      <div className="dash-filters dash-filters--users" role="group" aria-label="User filters">
        {!userQuery.trim() ? (
          <label>
            Search
            <input
              type="search"
              placeholder="email, name, or id…"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
            />
          </label>
        ) : null}
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Plan
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            {plans.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p>Loading…</p> : null}
      {!loading && visible.length === 0 ? <p className="muted">No users match.</p> : null}
      {visible.length > 0 ? (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Verified</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                {onPickUser ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.email}
                    {u.isAdmin ? " · admin" : ""}
                  </td>
                  <td>{u.name ?? "—"}</td>
                  <td>{u.emailVerified ? "yes" : "no"}</td>
                  <td>{u.subscriptionPlanKey ?? "—"}</td>
                  <td>{u.subscriptionStatus}</td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                  {onPickUser ? (
                    <td>
                      <button type="button" className="ghost" onClick={() => onPickUser(u)}>
                        Filter
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
