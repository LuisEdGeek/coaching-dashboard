import { useState } from "react";
import { DashboardPage } from "./components/DashboardPage";
import { LoginPage } from "./components/LoginPage";
import { getStoredToken } from "./metrics/api";
import "./styles.css";

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getStoredToken()));

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return <DashboardPage onLogout={() => setAuthed(false)} />;
}
