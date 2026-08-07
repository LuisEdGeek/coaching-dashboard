import { useState } from "react";
import { DashboardPage } from "./components/DashboardPage";
import { LoginPage } from "./components/LoginPage";
import { isDemoLoggedIn, isFixtureMode } from "./metrics/api";
import "./styles.css";

export default function App() {
  const [authed, setAuthed] = useState(() => isFixtureMode() && isDemoLoggedIn());

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return <DashboardPage onLogout={() => setAuthed(false)} />;
}
