import { useEffect, useState } from "react";
import { api } from "../api";
import type { Scholarship, ScholarshipStatus } from "../types";

const STATUSES: ScholarshipStatus[] = [
  "found",
  "shortlisted",
  "applying",
  "applied",
  "interview",
  "accepted",
  "rejected",
  "expired",
];

const emptyForm = {
  name: "",
  university: "",
  country: "",
  field_tags: "",
  degree_level: "Masters",
  funding_type: "",
  application_fee: "",
  deadline: "",
  deadline_notes: "",
  application_link: "",
  source_url: "",
  priority: "medium",
  notes: "",
};

export default function Scholarships() {
  const [items, setItems] = useState<Scholarship[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getScholarships(statusFilter || undefined).then(setItems).finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addScholarship({
      ...form,
      field_tags: form.field_tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      university: form.university || undefined,
      country: form.country || undefined,
      funding_type: form.funding_type || undefined,
      application_fee: form.application_fee || undefined,
      deadline: form.deadline || undefined,
      deadline_notes: form.deadline_notes || undefined,
      application_link: form.application_link || undefined,
      source_url: form.source_url || undefined,
      notes: form.notes || undefined,
    } as Partial<Scholarship>);
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const setStatus = async (id: string, status: ScholarshipStatus) => {
    await api.patchScholarship(id, { status });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this scholarship entry?")) return;
    await api.deleteScholarship(id);
    load();
  };

  return (
    <div>
      <div className="section-head">
        <h2>Scholarships & Admissions</h2>
        <div className="row">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add manually"}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card form-grid" onSubmit={submit} style={{ marginBottom: 20 }}>
          <input
            required
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="University"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
          />
          <input
            placeholder="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <input
            placeholder="Field tags (comma separated)"
            value={form.field_tags}
            onChange={(e) => setForm({ ...form, field_tags: e.target.value })}
          />
          <input
            placeholder="Funding type (full/partial/...)"
            value={form.funding_type}
            onChange={(e) => setForm({ ...form, funding_type: e.target.value })}
          />
          <input
            placeholder="Application fee (none/waived/$X)"
            value={form.application_fee}
            onChange={(e) => setForm({ ...form, application_fee: e.target.value })}
          />
          <input
            type="date"
            placeholder="Deadline"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <input
            placeholder="Deadline notes (e.g. varies by region)"
            value={form.deadline_notes}
            onChange={(e) => setForm({ ...form, deadline_notes: e.target.value })}
          />
          <input
            placeholder="Application link"
            value={form.application_link}
            onChange={(e) => setForm({ ...form, application_link: e.target.value })}
          />
          <input
            placeholder="Source URL"
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
          />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">high priority</option>
            <option value="medium">medium priority</option>
            <option value="low">low priority</option>
          </select>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button className="primary" type="submit">
            Save
          </button>
        </form>
      )}

      {loading && <p className="muted">Loading…</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>University / Country</th>
              <th>Deadline</th>
              <th>Fee</th>
              <th>Fields</th>
              <th>Status</th>
              <th>Link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  {s.priority === "high" && <span className="badge priority-high">high</span>}
                </td>
                <td className="muted small">{[s.university, s.country].filter(Boolean).join(" · ")}</td>
                <td className="small">{s.deadline || s.deadline_notes || "—"}</td>
                <td className="small">{s.application_fee || "—"}</td>
                <td className="small">{s.field_tags.join(", ")}</td>
                <td>
                  <select value={s.status} onChange={(e) => setStatus(s.id, e.target.value as ScholarshipStatus)}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {s.application_link && (
                    <a href={s.application_link} target="_blank" rel="noreferrer">
                      open
                    </a>
                  )}
                </td>
                <td>
                  <button className="ghost" onClick={() => remove(s.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <p className="muted" style={{ padding: 16 }}>No entries yet.</p>}
      </div>
    </div>
  );
}
