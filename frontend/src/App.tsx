import { GraduationCap, LayoutDashboard, FileText, User, ListChecks } from "lucide-react";
import { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Documents from "./components/Documents";
import Profile from "./components/Profile";
import Scholarships from "./components/Scholarships";

type Tab = "dashboard" | "scholarships" | "documents" | "profile";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "scholarships", label: "Scholarships", icon: ListChecks },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "profile", label: "Profile", icon: User },
];

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <GraduationCap size={22} strokeWidth={2.2} />
          <span>ScholarShip Helper</span>
        </div>
        <nav className="sidenav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                className={`navbtn ${tab === t.key ? "navbtn-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <Icon size={17} strokeWidth={2.2} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer muted small">Tracking your funded-only path abroad.</div>
      </aside>
      <div className="main-col">
        <header className="topbar">
          <h1>{activeLabel}</h1>
        </header>
        <main className="content">
          {tab === "dashboard" && <Dashboard />}
          {tab === "scholarships" && <Scholarships />}
          {tab === "documents" && <Documents />}
          {tab === "profile" && <Profile />}
        </main>
      </div>
    </div>
  );
}

export default App;
