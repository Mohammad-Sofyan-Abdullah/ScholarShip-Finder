import { useEffect, useState } from "react";
import { api } from "../api";
import type { Profile as ProfileType } from "../types";

type FormState = {
  full_name: string;
  email: string;
  university: string;
  degree: string;
  cgpa: string;
  graduation_date: string;
  target_degree: string;
  target_fields: string;
  target_countries: string;
  english_test: string;
  notes: string;
};

const blank: FormState = {
  full_name: "",
  email: "",
  university: "",
  degree: "",
  cgpa: "",
  graduation_date: "",
  target_degree: "",
  target_fields: "",
  target_countries: "",
  english_test: "",
  notes: "",
};

function toForm(p: ProfileType | null): FormState {
  if (!p) return blank;
  return {
    full_name: p.full_name ?? "",
    email: p.email ?? "",
    university: p.university ?? "",
    degree: p.degree ?? "",
    cgpa: p.cgpa?.toString() ?? "",
    graduation_date: p.graduation_date ?? "",
    target_degree: p.target_degree ?? "",
    target_fields: (p.target_fields ?? []).join(", "),
    target_countries: (p.target_countries ?? []).join(", "),
    english_test: p.english_test ?? "",
    notes: p.notes ?? "",
  };
}

export default function Profile() {
  const [form, setForm] = useState<FormState>(blank);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getProfile().then((p) => setForm(toForm(p)));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.putProfile({
      full_name: form.full_name,
      email: form.email,
      university: form.university,
      degree: form.degree,
      cgpa: form.cgpa ? Number(form.cgpa) : undefined,
      graduation_date: form.graduation_date || undefined,
      target_degree: form.target_degree,
      target_fields: form.target_fields.split(",").map((s) => s.trim()).filter(Boolean),
      target_countries: form.target_countries.split(",").map((s) => s.trim()).filter(Boolean),
      english_test: form.english_test,
      notes: form.notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="section-head">
        <h2>Profile</h2>
      </div>
      <form className="card form-grid" onSubmit={save}>
        <input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
        <input placeholder="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        <input placeholder="CGPA" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} />
        <input
          type="date"
          placeholder="Graduation date"
          value={form.graduation_date}
          onChange={(e) => setForm({ ...form, graduation_date: e.target.value })}
        />
        <input
          placeholder="Target degree"
          value={form.target_degree}
          onChange={(e) => setForm({ ...form, target_degree: e.target.value })}
        />
        <input placeholder="English test (IELTS 7.0, etc.)" value={form.english_test} onChange={(e) => setForm({ ...form, english_test: e.target.value })} />
        <input
          placeholder="Target fields (comma separated)"
          value={form.target_fields}
          onChange={(e) => setForm({ ...form, target_fields: e.target.value })}
        />
        <input
          placeholder="Target countries (comma separated)"
          value={form.target_countries}
          onChange={(e) => setForm({ ...form, target_countries: e.target.value })}
        />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="primary" type="submit">
          Save
        </button>
        {saved && <span className="muted small">Saved.</span>}
      </form>
    </div>
  );
}
