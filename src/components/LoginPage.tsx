import { useState, type FormEvent } from "react";
import { loginAdmin } from "../metrics/api";

type Props = {
  onSuccess: () => void;
};

export function LoginPage({ onSuccess }: Props) {
  const [email, setEmail] = useState("admin@deliberate.coach");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginAdmin(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-bg" aria-hidden />
      <form className="login-panel" onSubmit={onSubmit}>
        <p className="brand-mark">Deliberate Coaching</p>
        <h1>Beta ops dashboard</h1>
        <p className="login-lead">
          P0 metrics for AI quality, stability, activation, and journey health.
          Fixture mode works without the API — any non-empty password.
        </p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Enter dashboard"}
        </button>
      </form>
    </div>
  );
}
