import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Public certificate verification endpoint — no authentication required.
// Rate limited to 30 requests per minute per IP.
// Only returns data for 'issued' and 'revoked' certificates.

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

// In-memory rate limit store (per-isolate; reset on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

// Periodic cleanup to prevent memory growth
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/**
 * Mask name for children's program: first name + last initial.
 * "Ahmed Al-Rashid" → "Ahmed A."
 */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ valid: false, error: "Method not allowed" }),
      { status: 405, headers: CORS_HEADERS },
    );
  }

  // Rate limiting
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ valid: false, error: "Too many requests" }),
      { status: 429, headers: CORS_HEADERS },
    );
  }

  // Periodic cleanup (every ~100 requests)
  if (Math.random() < 0.01) cleanupRateLimitMap();

  // Parse certificate number
  const url = new URL(req.url);
  const certNumber = url.searchParams.get("number");

  if (!certNumber) {
    return new Response(
      JSON.stringify({ valid: false, error: "Missing certificate number" }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const supabase = getSupabaseAdmin();

  // Query certification with program info
  const { data: cert, error } = await supabase
    .from("certifications")
    .select(`
      status, type, title, issue_date, certificate_number,
      chain_of_narration, revoked_at,
      student:profiles!certifications_student_id_fkey ( full_name ),
      program:programs!certifications_program_id_fkey ( name, name_ar, settings ),
      track:program_tracks!certifications_track_id_fkey ( name, name_ar ),
      issuer:profiles!certifications_issued_by_fkey ( full_name )
    `)
    .eq("certificate_number", certNumber)
    .in("status", ["issued", "revoked"])
    .single();

  if (error || !cert) {
    return new Response(
      JSON.stringify({ valid: false, error: "Certificate not found" }),
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Determine if minor privacy masking is needed
  const program = cert.program as { name: string; name_ar: string; settings: Record<string, unknown> } | null;
  const isChildrenProgram =
    program?.name?.toLowerCase().includes("children") ||
    (program?.settings as Record<string, unknown>)?.is_children_program === true;

  const student = cert.student as { full_name: string } | null;
  const holderName = student?.full_name
    ? isChildrenProgram
      ? maskName(student.full_name)
      : student.full_name
    : "";

  const track = cert.track as { name: string; name_ar: string } | null;
  const issuer = cert.issuer as { full_name: string } | null;

  const certificate = {
    holder_name: holderName,
    program: program?.name ?? "",
    track: track?.name ?? null,
    type: cert.type,
    title: cert.title,
    issue_date: cert.issue_date,
    certificate_number: cert.certificate_number,
    issued_by: issuer?.full_name ?? "WeReciteTogether (نتلو معاً)",
  };

  if (cert.status === "revoked") {
    return new Response(
      JSON.stringify({
        valid: false,
        status: "revoked",
        revoked_at: cert.revoked_at,
        certificate,
      }),
      { status: 200, headers: CORS_HEADERS },
    );
  }

  return new Response(
    JSON.stringify({ valid: true, certificate }),
    { status: 200, headers: CORS_HEADERS },
  );
});
