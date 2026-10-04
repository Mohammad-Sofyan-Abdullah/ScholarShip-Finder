import {
  Award,
  FileText,
  GraduationCap,
  Mail,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Document } from "../types";

const TYPES = ["cv", "sop", "transcript", "lor", "test_score", "other"] as const;

const TYPE_LABELS: Record<string, string> = {
  cv: "CV / Resume",
  sop: "Statement of Purpose",
  transcript: "Transcripts",
  lor: "Letters of Recommendation",
  test_score: "Test Scores (IELTS/TOEFL/GRE)",
  other: "Other",
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  cv: FileText,
  sop: FileText,
  transcript: GraduationCap,
  lor: Mail,
  test_score: Award,
  other: FileText,
};

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [docType, setDocType] = useState<string>("cv");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.getDocuments().then(setDocs);

  useEffect(() => {
    load();
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await api.uploadDocument(file, docType, notes || undefined);
      }
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const open = async (id: string) => {
    const { url } = await api.getDocumentUrl(id);
    window.open(url, "_blank");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await api.deleteDocument(id);
    load();
  };

  const grouped = TYPES.map((t) => ({ type: t, docs: docs.filter((d) => d.doc_type === t) })).filter(
    (g) => g.docs.length > 0
  );

  return (
    <div>
      <div className="section-head">
        <h2>Documents</h2>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="row" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        </div>

        <label
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <UploadCloud size={26} style={{ marginBottom: 8 }} />
          <div>{busy ? "Uploading…" : "Drag & drop files here, or click to browse"}</div>
          <div className="small">Will be tagged as "{TYPE_LABELS[docType]}"</div>
          <input
            ref={fileRef}
            type="file"
            multiple
            disabled={busy}
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </label>
      </div>

      {grouped.length === 0 && <p className="muted">No documents uploaded yet.</p>}

      {grouped.map((group) => {
        const Icon = TYPE_ICONS[group.type];
        return (
          <div key={group.type}>
            <div className="doc-group-title">{TYPE_LABELS[group.type]}</div>
            <div className="table-wrap card-list" style={{ gap: 0 }}>
              {group.docs.map((d) => (
                <div className="doc-row" key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="doc-icon">
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <strong>{d.name}</strong>
                    </div>
                    <div className="muted small">
                      uploaded {d.uploaded_at.slice(0, 10)} {d.notes ? `· ${d.notes}` : ""}
                    </div>
                  </div>
                  <div className="row">
                    <button onClick={() => open(d.id)}>Open</button>
                    <button className="ghost" onClick={() => remove(d.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
