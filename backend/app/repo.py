"""
Data access layer for ScholarShip Helper. Wraps the Supabase tables
(profile, documents, scholarships) created by schema.sql, plus the
'documents' storage bucket. No FastAPI/HTTP concerns live here on
purpose, so this module can also be imported directly by one-off
scripts (e.g. the scheduled scholarship-research job) without needing
the API server running.
"""
import mimetypes
import os
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "documents"

_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_client() -> Client:
    return _client


# ---- profile -----------------------------------------------------------

def get_profile():
    rows = _client.table("profile").select("*").limit(1).execute().data
    return rows[0] if rows else None


def upsert_profile(data: dict):
    existing = get_profile()
    if existing:
        _client.table("profile").update(data).eq("id", existing["id"]).execute()
        return get_profile()
    return _client.table("profile").insert(data).execute().data[0]


# ---- documents -----------------------------------------------------------

def list_documents():
    return _client.table("documents").select("*").order("uploaded_at", desc=True).execute().data


def get_document(doc_id: str):
    rows = _client.table("documents").select("*").eq("id", doc_id).execute().data
    return rows[0] if rows else None


def add_document(name: str, doc_type: str, content: bytes, notes: str | None = None):
    storage_path = f"{doc_type}/{name}"
    content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
    _client.storage.from_(BUCKET).upload(
        storage_path, content, file_options={"content-type": content_type, "upsert": "true"}
    )
    return _client.table("documents").insert(
        {"name": name, "doc_type": doc_type, "storage_path": storage_path, "notes": notes}
    ).execute().data[0]


def delete_document(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        return
    _client.storage.from_(BUCKET).remove([doc["storage_path"]])
    _client.table("documents").delete().eq("id", doc_id).execute()


def get_document_url(doc_id: str, expires_in: int = 3600):
    doc = get_document(doc_id)
    if not doc:
        return None
    signed = _client.storage.from_(BUCKET).create_signed_url(doc["storage_path"], expires_in)
    return signed.get("signedURL") or signed.get("signed_url")


# ---- scholarships --------------------------------------------------------

def list_scholarships(status: str | None = None):
    q = _client.table("scholarships").select("*").order("deadline")
    if status:
        q = q.eq("status", status)
    return q.execute().data


def list_upcoming(days: int = 30):
    today = date.today()
    horizon = today + timedelta(days=days)
    return (
        _client.table("scholarships")
        .select("*")
        .gte("deadline", today.isoformat())
        .lte("deadline", horizon.isoformat())
        .neq("status", "expired")
        .neq("status", "rejected")
        .order("deadline")
        .execute()
        .data
    )


def upsert_scholarship(entry: dict):
    entry.setdefault("status", "found")
    entry.setdefault("priority", "medium")
    return _client.table("scholarships").upsert(entry, on_conflict="name,university,deadline").execute().data


def update_scholarship(scholarship_id: str, patch: dict):
    return _client.table("scholarships").update(patch).eq("id", scholarship_id).execute().data


def delete_scholarship(scholarship_id: str):
    _client.table("scholarships").delete().eq("id", scholarship_id).execute()
