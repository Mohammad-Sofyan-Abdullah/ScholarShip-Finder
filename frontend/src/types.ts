export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  university: string | null;
  degree: string | null;
  cgpa: number | null;
  graduation_date: string | null;
  target_degree: string | null;
  target_fields: string[];
  target_countries: string[];
  english_test: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Document {
  id: string;
  name: string;
  doc_type: string;
  storage_path: string;
  version: number;
  uploaded_at: string;
  notes: string | null;
}

export type ScholarshipStatus =
  | "found"
  | "shortlisted"
  | "applying"
  | "applied"
  | "interview"
  | "accepted"
  | "rejected"
  | "expired";

export interface Scholarship {
  id: string;
  name: string;
  university: string | null;
  country: string | null;
  field_tags: string[];
  degree_level: string;
  funding_type: string | null;
  application_fee: string | null;
  deadline: string | null;
  deadline_notes: string | null;
  application_link: string | null;
  source_url: string | null;
  status: ScholarshipStatus;
  priority: "high" | "medium" | "low";
  discovered_at: string;
  last_checked: string;
  notes: string | null;
}
