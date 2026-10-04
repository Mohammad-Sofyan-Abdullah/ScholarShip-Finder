import { ExternalLink, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api";
import { RESEARCH_ROUTINE_URL } from "../config";
import type { Scholarship } from "../types";

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number | null): string {
  if (days === null) return "";
  if (days <= 7) return "urgent";
  if (days <= 21) return "soon";
  return "ok";
}

export default function Dashboard() {
  const [items, setItems] = useState<Scholarship[]>([]);
  const [all, setAll] = useState<Scholarship[]>([]);
  const [horizon, setHorizon] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getUpcoming(horizon), api.getScholarships()])
      .then(([upcoming, everything]) => {
        setItems(upcoming);
        setAll(everything);
      })
      .finally(() => setLoading(false));
  }, [horizon]);

  const highPriority = all.filter((s) => s.priority === "high" && !["rejected", "expired"].includes(s.status)).length;
  const applied = all.filter((s) => ["applying", "applied", "interview", "accepted"].includes(s.status)).length;
  const tracked = all.filter((s) => !["rejected", "expired"].includes(s.status)).length;

  return (
    <div>
      <div className="research-banner">
        <div>
          <h3>Weekly AI/ML scholarship research</h3>
          <p>Runs every Monday automatically. Opens the routine's control page — one click to fire it now.</p>
        </div>
        <a className="btn-run" href={RESEARCH_ROUTINE_URL} target="_blank" rel="noreferrer">
          <Sparkles size={16} /> Run research now <ExternalLink size={14} />
        </a>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{tracked}</span>
          <span className="stat-label">Tracked (active)</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{items.length}</span>
          <span className="stat-label">Deadlines in {horizon}d</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{highPriority}</span>
          <span className="stat-label">High priority</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{applied}</span>
          <span className="stat-label">In progress / applied</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Upcoming deadlines</h2>
        <div className="row">
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              className={`chip ${horizon === d ? "chip-active" : ""}`}
              onClick={() => setHorizon(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="muted">Nothing with a deadline in the next {horizon} days. Run the research job above to find more.</p>
      )}

      <div className="card-list">
        {items.map((s) => {
          const d = daysLeft(s.deadline);
          return (
            <div className={`card deadline-card ${urgencyClass(d)}`} key={s.id}>
              <div className="deadline-days">
                {d !== null ? `${d}d` : "—"}
                <div className="muted small">{s.deadline}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{s.name}</strong>
                  <span className={`badge status-${s.status}`}>{s.status}</span>
                </div>
                <div className="muted small">
                  {[s.university, s.country].filter(Boolean).join(" · ")}
                  {s.funding_type ? ` · ${s.funding_type}` : ""}
                  {s.application_fee ? ` · fee: ${s.application_fee}` : ""}
                </div>
                {s.application_link && (
                  <a className="small" href={s.application_link} target="_blank" rel="noreferrer">
                    Application link →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
