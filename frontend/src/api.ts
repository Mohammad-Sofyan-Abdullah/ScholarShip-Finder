import type { Document, Profile, Scholarship } from "./types";

const BASE = "http://127.0.0.1:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  getProfile: () => request<Profile | null>("/profile"),
  putProfile: (data: Partial<Profile>) =>
    request<Profile>("/profile", { method: "PUT", body: JSON.stringify(data) }),

  getDocuments: () => request<Document[]>("/documents"),
  uploadDocument: (file: File, docType: string, notes?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    if (notes) form.append("notes", notes);
    return request<Document>("/documents", { method: "POST", body: form });
  },
  getDocumentUrl: (id: string) => request<{ url: string }>(`/documents/${id}/url`),
  deleteDocument: (id: string) => request<{ ok: boolean }>(`/documents/${id}`, { method: "DELETE" }),

  getScholarships: (status?: string) =>
    request<Scholarship[]>(`/scholarships${status ? `?status=${status}` : ""}`),
  getUpcoming: (days = 30) => request<Scholarship[]>(`/scholarships/upcoming?days=${days}`),
  addScholarship: (entry: Partial<Scholarship>) =>
    request<Scholarship[]>("/scholarships", { method: "POST", body: JSON.stringify(entry) }),
  patchScholarship: (id: string, patch: Partial<Scholarship>) =>
    request<Scholarship[]>(`/scholarships/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteScholarship: (id: string) =>
    request<{ ok: boolean }>(`/scholarships/${id}`, { method: "DELETE" }),
};
