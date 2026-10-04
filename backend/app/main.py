from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import repo

app = FastAPI(title="ScholarShip Helper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProfileIn(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    cgpa: Optional[float] = None
    graduation_date: Optional[str] = None
    target_degree: Optional[str] = None
    target_fields: Optional[list[str]] = None
    target_countries: Optional[list[str]] = None
    english_test: Optional[str] = None
    notes: Optional[str] = None


class ScholarshipIn(BaseModel):
    name: str
    university: Optional[str] = None
    country: Optional[str] = None
    field_tags: list[str] = []
    degree_level: str = "Masters"
    funding_type: Optional[str] = None
    application_fee: Optional[str] = None
    deadline: Optional[str] = None
    deadline_notes: Optional[str] = None
    application_link: Optional[str] = None
    source_url: Optional[str] = None
    status: str = "found"
    priority: str = "medium"
    notes: Optional[str] = None


class ScholarshipPatch(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[str] = None


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/profile")
def get_profile():
    return repo.get_profile()


@app.put("/api/profile")
def put_profile(data: ProfileIn):
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    return repo.upsert_profile(payload)


@app.get("/api/documents")
def get_documents():
    return repo.list_documents()


@app.post("/api/documents")
async def post_document(
    file: UploadFile = File(...),
    doc_type: str = Form("other"),
    notes: Optional[str] = Form(None),
):
    content = await file.read()
    return repo.add_document(file.filename, doc_type, content, notes)


@app.get("/api/documents/{doc_id}/url")
def document_url(doc_id: str):
    url = repo.get_document_url(doc_id)
    if not url:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"url": url}


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    repo.delete_document(doc_id)
    return {"ok": True}


@app.get("/api/scholarships")
def get_scholarships(status: Optional[str] = None):
    return repo.list_scholarships(status)


@app.get("/api/scholarships/upcoming")
def get_upcoming(days: int = 30):
    return repo.list_upcoming(days)


@app.post("/api/scholarships")
def post_scholarship(entry: ScholarshipIn):
    return repo.upsert_scholarship(entry.model_dump(exclude_none=True))


@app.post("/api/scholarships/bulk")
def post_scholarships_bulk(entries: list[ScholarshipIn]):
    return [repo.upsert_scholarship(e.model_dump(exclude_none=True)) for e in entries]


@app.patch("/api/scholarships/{scholarship_id}")
def patch_scholarship(scholarship_id: str, patch: ScholarshipPatch):
    payload = {k: v for k, v in patch.model_dump().items() if v is not None}
    return repo.update_scholarship(scholarship_id, payload)


@app.delete("/api/scholarships/{scholarship_id}")
def delete_scholarship(scholarship_id: str):
    repo.delete_scholarship(scholarship_id)
    return {"ok": True}
