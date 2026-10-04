#!/usr/bin/env python
"""
ScholarShip Helper — CLI for tracking scholarships/admissions and documents in Supabase.

Setup (one-time):
  1. Run schema.sql in the Supabase SQL Editor (dashboard > SQL Editor > New query > paste > Run)
  2. pip install -r requirements.txt
  3. python manage.py init-storage
  4. python manage.py seed-profile
  5. python manage.py upload-doc "CV_Latest.pdf" --type cv

Day to day:
  python manage.py list-upcoming --days 30
  python manage.py add-scholarship --file new_scholarship.json
  python manage.py update-status <id> applied
  python manage.py list-docs
"""
import argparse
import json
import mimetypes
import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "documents"

client = create_client(SUPABASE_URL, SUPABASE_KEY)


def init_storage(_args):
    buckets = [b.name for b in client.storage.list_buckets()]
    if BUCKET in buckets:
        print(f"Bucket '{BUCKET}' already exists.")
        return
    client.storage.create_bucket(BUCKET, options={"public": False})
    print(f"Created private bucket '{BUCKET}'.")


def seed_profile(args):
    row = {
        "full_name": args.name or "Mohammad Sofyan Abdullah",
        "email": args.email or "sofyanrajpoot567@gmail.com",
        "university": "COMSATS University Islamabad",
        "degree": "BS Data Science",
        "cgpa": 3.58,
        "graduation_date": "2026-03-01",
        "target_degree": "Masters",
        "target_fields": ["Machine Learning", "Deep Learning", "Cloud AI", "LLM", "NLP", "GenAI"],
        "target_countries": ["Japan", "Germany", "Saudi Arabia", "Italy", "Europe", "USA"],
        "notes": "Zero-budget applicant: only free/fee-waived applications + fully funded scholarships.",
    }
    existing = client.table("profile").select("id").execute().data
    if existing:
        client.table("profile").update(row).eq("id", existing[0]["id"]).execute()
        print("Updated existing profile row.")
    else:
        client.table("profile").insert(row).execute()
        print("Inserted profile row.")


def upload_doc(args):
    path = Path(args.path)
    if not path.exists():
        sys.exit(f"File not found: {path}")
    storage_path = f"{args.type}/{path.name}"
    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    with open(path, "rb") as f:
        client.storage.from_(BUCKET).upload(
            storage_path,
            f.read(),
            file_options={"content-type": content_type, "upsert": "true"},
        )
    client.table("documents").insert(
        {
            "name": path.name,
            "doc_type": args.type,
            "storage_path": storage_path,
            "notes": args.notes,
        }
    ).execute()
    print(f"Uploaded {path.name} -> {BUCKET}/{storage_path}")


def list_docs(_args):
    rows = client.table("documents").select("*").order("uploaded_at", desc=True).execute().data
    if not rows:
        print("No documents stored yet.")
        return
    for r in rows:
        print(f"[{r['doc_type']}] {r['name']}  (uploaded {r['uploaded_at'][:10]})  path={r['storage_path']}")


def add_scholarship(args):
    if args.file:
        data = json.loads(Path(args.file).read_text(encoding="utf-8"))
    elif args.json:
        data = json.loads(args.json)
    else:
        sys.exit("Provide --file <path.json> or --json '<json>'")

    entries = data if isinstance(data, list) else [data]
    inserted, skipped = 0, 0
    for entry in entries:
        entry.setdefault("status", "found")
        entry.setdefault("priority", "medium")
        try:
            client.table("scholarships").upsert(
                entry, on_conflict="name,university,deadline"
            ).execute()
            inserted += 1
        except Exception as e:  # noqa: BLE001
            print(f"Skipped '{entry.get('name')}': {e}")
            skipped += 1
    print(f"Upserted {inserted} scholarship(s), {skipped} skipped.")


def list_upcoming(args):
    today = date.today()
    horizon = today + timedelta(days=args.days)
    rows = (
        client.table("scholarships")
        .select("*")
        .gte("deadline", today.isoformat())
        .lte("deadline", horizon.isoformat())
        .neq("status", "expired")
        .neq("status", "rejected")
        .order("deadline")
        .execute()
        .data
    )
    if not rows:
        print(f"Nothing with a deadline in the next {args.days} days.")
        return
    print(f"Deadlines in the next {args.days} days:\n")
    for r in rows:
        days_left = (datetime.strptime(r["deadline"], "%Y-%m-%d").date() - today).days
        print(
            f"[{days_left:>3}d] {r['deadline']}  {r['name']} — {r.get('university') or r.get('country') or ''}"
            f"  (status={r['status']}, fee={r.get('application_fee')})"
        )
        if r.get("application_link"):
            print(f"        {r['application_link']}")


def list_all(args):
    q = client.table("scholarships").select("*").order("deadline")
    if args.status:
        q = q.eq("status", args.status)
    rows = q.execute().data
    for r in rows:
        print(f"{r['deadline']}  [{r['status']:<10}] {r['name']} — {r.get('university') or r.get('country') or ''}")


def update_status(args):
    client.table("scholarships").update({"status": args.status}).eq("id", args.id).execute()
    print(f"Updated {args.id} -> status={args.status}")


def main():
    p = argparse.ArgumentParser(description="ScholarShip Helper CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init-storage").set_defaults(func=init_storage)

    sp = sub.add_parser("seed-profile")
    sp.add_argument("--name")
    sp.add_argument("--email")
    sp.set_defaults(func=seed_profile)

    sp = sub.add_parser("upload-doc")
    sp.add_argument("path")
    sp.add_argument("--type", default="other", choices=["cv", "sop", "transcript", "lor", "test_score", "other"])
    sp.add_argument("--notes", default=None)
    sp.set_defaults(func=upload_doc)

    sub.add_parser("list-docs").set_defaults(func=list_docs)

    sp = sub.add_parser("add-scholarship")
    sp.add_argument("--file", help="Path to a JSON file (single object or array of objects)")
    sp.add_argument("--json", help="Inline JSON object")
    sp.set_defaults(func=add_scholarship)

    sp = sub.add_parser("list-upcoming")
    sp.add_argument("--days", type=int, default=30)
    sp.set_defaults(func=list_upcoming)

    sp = sub.add_parser("list-all")
    sp.add_argument("--status", default=None)
    sp.set_defaults(func=list_all)

    sp = sub.add_parser("update-status")
    sp.add_argument("id")
    sp.add_argument("status", choices=["found", "shortlisted", "applying", "applied", "interview", "accepted", "rejected", "expired"])
    sp.set_defaults(func=update_status)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
