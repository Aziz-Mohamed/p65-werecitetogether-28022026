// ─── Enums & Literals ────────────────────────────────────────────────────────

export type CertificationType = 'ijazah' | 'graduation' | 'completion';

export type CertificationStatus =
  | 'recommended'
  | 'supervisor_approved'
  | 'issued'
  | 'returned'
  | 'rejected'
  | 'revoked';

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface Certification {
  id: string;
  student_id: string;
  teacher_id: string;
  program_id: string;
  track_id: string | null;
  type: CertificationType;
  status: CertificationStatus;
  title: string;
  title_ar: string | null;
  notes: string | null;
  review_notes: string | null;
  chain_of_narration: string | null;
  certificate_number: string | null;
  issued_by: string | null;
  reviewed_by: string | null;
  issue_date: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Composite / Joined Types ────────────────────────────────────────────────

export interface CertificationWithDetails extends Certification {
  student: { id: string; full_name: string; avatar_url: string | null } | null;
  teacher: { id: string; full_name: string } | null;
  program: { id: string; name: string; name_ar: string; category: string } | null;
  track: { id: string; name: string; name_ar: string } | null;
  issuer: { id: string; full_name: string } | null;
  reviewer: { id: string; full_name: string } | null;
}

export interface CertificationQueueItem {
  id: string;
  student_name: string;
  student_avatar: string | null;
  teacher_name: string;
  program_name: string;
  track_name: string | null;
  type: CertificationType;
  status: CertificationStatus;
  title: string;
  created_at: string;
}

export interface CertificationPipeline {
  recommended: number;
  supervisor_approved: number;
  issued: number;
  returned: number;
  rejected: number;
  revoked: number;
  total: number;
}

export interface VerificationResult {
  valid: boolean;
  status?: string;
  revoked_at?: string;
  error?: string;
  certificate?: {
    holder_name: string;
    program: string;
    track: string | null;
    type: CertificationType;
    title: string;
    issue_date: string;
    certificate_number: string;
    issued_by: string;
  };
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface RecommendInput {
  studentId: string;
  programId: string;
  trackId?: string;
  type: CertificationType;
  title: string;
  titleAr?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ReviewInput {
  certificationId: string;
  action: 'approve' | 'return';
  reviewNotes?: string;
}

export interface IssueInput {
  certificationId: string;
  action: 'issue' | 'reject';
  chainOfNarration?: string;
  reviewNotes?: string;
}

export interface RevokeInput {
  certificationId: string;
  revocationReason: string;
}

export interface ResubmitInput {
  certificationId: string;
  notes?: string;
  title?: string;
  titleAr?: string;
}

export interface CertificationFilters {
  programId?: string;
  type?: CertificationType;
  status?: CertificationStatus;
  dateFrom?: string;
  dateTo?: string;
}
