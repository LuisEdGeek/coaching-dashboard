import { useState, type FormEvent } from "react";
import { apiBaseConfigured, loginAdmin } from "../metrics/api";

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
      if (!apiBaseConfigured()) {
        throw new Error("Set VITE_API_BASE_URL in .env to your coaching-app-back URL");
      }
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
        <h1>Deliberate KPIs</h1>
        {!apiBaseConfigured() ? (
          <p className="form-error">Missing VITE_API_BASE_URL in .env</p>
        ) : null}
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
        <button type="submit" disabled={busy || !apiBaseConfigured()}>
          {busy ? "Signing in…" : "Enter dashboard"}
        </button>
      </form>
    </div>
  );
}
