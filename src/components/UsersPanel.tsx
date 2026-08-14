import { useEffect, useState } from "react";
import { fetchAdminUsers, type AdminUserRow, type DateRangeQuery } from "../metrics/api";

type Props = { range: DateRangeQuery };

export function UsersPanel({ range }: Props) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminUsers(range)
      .then((r) => {
        if (!cancelled) setUsers(r.users);
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
  }, [range.days, range.from, range.to]);

  return (
    <section className="ops-panel">
      <header className="ops-panel__head">
        <h2>Users</h2>
        <p>Accounts created in the selected date range (max 500).</p>
      </header>
      {error ? (
        <div className="banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p>Loading…</p> : null}
      {!loading && users.length === 0 ? <p className="muted">No users in this range.</p> : null}
      {users.length > 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
