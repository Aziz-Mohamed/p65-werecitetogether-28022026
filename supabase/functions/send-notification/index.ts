import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: "public";
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  channelId?: string;
  categoryId?: string;
}

type NotificationCategory =
  | "session_completed"
  | "enrollment_approved"
  | "waitlist_offer"
  | "cohort_update"
  | "voice_memo_received"
  | "queue_threshold"
  | "rating_prompt"
  | "supervisor_alert"
  | "himam_reminder";

// Map notification categories to guardian notification categories for routing
const GUARDIAN_CATEGORY_MAP: Record<string, string> = {
  session_completed: "session_outcomes",
  enrollment_approved: "milestones",
  voice_memo_received: "session_outcomes",
};

const TABLE_TO_CATEGORY: Record<string, NotificationCategory> = {
  sessions: "session_completed",
  enrollments: "enrollment_approved",
  program_waitlist: "waitlist_offer",
  cohorts: "cohort_update",
  session_voice_memos: "voice_memo_received",
  teacher_reviews: "supervisor_alert",
};

// ─── Dedup Cache (in-memory, per isolate lifetime) ─────────────────────────

const recentSends = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000;

type NotificationCategory =
  | "sticker_awarded"
  | "trophy_earned"
  | "achievement_unlocked"
  | "attendance_marked"
  | "session_completed"
  | "voice_memo_attached"
  | "rating_prompt"
  | "flagged_review_alert"
  | "low_rating_alert"
  | "recovered_alert"
  | "queue_available"
  | "teacher_demand"
  | "supervisor_flag"
  | "certification_recommended"
  | "certification_supervisor_approved"
  | "certification_returned"
  | "certification_issued"
  | "certification_rejected"
  | "certification_revoked"
  | "himam_partner_assigned"
  | "himam_event_reminder"
  | "himam_event_cancelled"
  | "milestone_badge_earned";

// Direct notification categories (invoked via pg_net or Edge Functions, not standard webhooks)
const DIRECT_CATEGORIES = new Set<string>([
  "low_rating_alert",
  "recovered_alert",
  "queue_available",
  "teacher_demand",
  "supervisor_flag",
  "certification_recommended",
  "certification_supervisor_approved",
  "certification_returned",
  "certification_issued",
  "certification_rejected",
  "certification_revoked",
  "himam_partner_assigned",
  "himam_event_reminder",
  "himam_event_cancelled",
  "milestone_badge_earned",
]);

// ─── Table → Categories Mapping ─────────────────────────────────────────────

const TABLE_TO_CATEGORIES: Record<string, NotificationCategory[]> = {
  student_stickers: ["sticker_awarded"],
  student_trophies: ["trophy_earned"],
  student_achievements: ["achievement_unlocked"],
  attendance: ["attendance_marked"],
  sessions: ["session_completed", "rating_prompt"],
  session_voice_memos: ["voice_memo_attached"],
  teacher_ratings: ["flagged_review_alert"],
};

function getActiveCategories(
  categories: NotificationCategory[],
  record: Record<string, unknown>,
): NotificationCategory[] {
  return categories.filter((cat) => {
    if (cat === "rating_prompt" && record.status !== "completed") return false;
    if (cat === "flagged_review_alert" && !record.is_flagged) return false;
    return true;
  });
}

// ─── Supabase Client ────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ─── Recipient Lookup ───────────────────────────────────────────────────────

async function getRecipients(
  supabase: ReturnType<typeof createClient>,
  category: NotificationCategory,
  record: Record<string, unknown>,
): Promise<string[]> {
  const recipients: string[] = [];

  // Voice memo: look up student from the session
  if (category === "voice_memo_attached") {
    const sessionId = record.session_id as string;
    const { data: session } = await supabase
      .from("sessions")
      .select("student_id")
      .eq("id", sessionId)
      .single();
    if (!session?.student_id) return recipients;

    recipients.push(session.student_id);

    // Also notify parent
    const { data: student } = await supabase
      .from("students")
      .select("parent_id")
      .eq("id", session.student_id)
      .single();
    if (student?.parent_id) {
      recipients.push(student.parent_id);
    }

    return recipients;
  }

  // Teacher demand: notify offline teachers assigned to the program
  if (category === "teacher_demand") {
    const programId = record.program_id as string | undefined;
    if (!programId) return recipients;

    // Find teachers assigned to this program who are NOT currently available
    const { data: offlineTeachers } = await supabase
      .from("teacher_availability")
      .select("teacher_id")
      .eq("program_id", programId)
      .eq("is_available", false);

    if (offlineTeachers) {
      for (const t of offlineTeachers) {
        if (!recipients.includes(t.teacher_id)) {
          recipients.push(t.teacher_id);
        }
      }
    }

    return recipients;
  }

  // Queue available: student only
  if (category === "queue_available") {
    const studentId = record.student_id as string | undefined;
    if (studentId) recipients.push(studentId);
    return recipients;
  }

  // Rating prompt: student only (no parent) for completed sessions
  if (category === "rating_prompt") {
    const studentId = record.student_id as string | undefined;
    if (studentId) recipients.push(studentId);
    return recipients;
  }

  // Flagged review alert: send to the teacher's supervisor(s)
  if (category === "flagged_review_alert") {
    const teacherId = record.teacher_id as string | undefined;
    if (!teacherId) return recipients;

    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("supervisor_id")
      .eq("id", teacherId)
      .single();

    if (teacherProfile?.supervisor_id) {
      recipients.push(teacherProfile.supervisor_id);
    }

    return recipients;
  }

  // Low rating / recovered alerts: send to program admins and the teacher's supervisor
  if (category === "low_rating_alert" || category === "recovered_alert") {
    const teacherId = record.teacher_id as string | undefined;
    const programId = record.program_id as string | undefined;

    if (teacherId) {
      const { data: teacherProfile } = await supabase
        .from("profiles")
        .select("supervisor_id")
        .eq("id", teacherId)
        .single();

      if (teacherProfile?.supervisor_id) {
        recipients.push(teacherProfile.supervisor_id);
      }
    }

    // Also notify program admins
    if (programId) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["program_admin", "master_admin"]);

      if (admins) {
        for (const admin of admins) {
          if (!recipients.includes(admin.id)) {
            recipients.push(admin.id);
          }
        }
      }
    }

    return recipients;
  }

  // Supervisor flag: notify all program_admins for the teacher's program
  if (category === "supervisor_flag") {
    const programId = record.program_id as string | undefined;
    if (!programId) return recipients;

    const { data: programAdmins } = await supabase
      .from("program_roles")
      .select("profile_id")
      .eq("program_id", programId)
      .eq("role", "program_admin");

    if (programAdmins) {
      for (const pa of programAdmins) {
        if (!recipients.includes(pa.profile_id)) {
          recipients.push(pa.profile_id);
        }
      }
    }

    // Also notify master admins
    const { data: masterAdmins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "master_admin");

    if (masterAdmins) {
      for (const ma of masterAdmins) {
        if (!recipients.includes(ma.id)) {
          recipients.push(ma.id);
        }
      }
    }

    return recipients;
  }

  // Certification: recommended → notify supervisor(s)
  if (category === "certification_recommended") {
    const programId = record.program_id as string | undefined;
    const teacherId = record.teacher_id as string | undefined;
    if (!programId || !teacherId) return recipients;

    // Find supervisors for this teacher in this program
    const { data: roles } = await supabase
      .from("program_roles")
      .select("supervisor_id")
      .eq("profile_id", teacherId)
      .eq("program_id", programId)
      .not("supervisor_id", "is", null);

    if (roles) {
      for (const r of roles) {
        if (r.supervisor_id && !recipients.includes(r.supervisor_id)) {
          recipients.push(r.supervisor_id);
        }
      }
    }
    return recipients;
  }

  // Certification: supervisor approved → notify program admins
  if (category === "certification_supervisor_approved") {
    const programId = record.program_id as string | undefined;
    if (!programId) return recipients;

    const { data: admins } = await supabase
      .from("program_roles")
      .select("profile_id")
      .eq("program_id", programId)
      .eq("role", "program_admin");

    if (admins) {
      for (const a of admins) {
        if (!recipients.includes(a.profile_id)) {
          recipients.push(a.profile_id);
        }
      }
    }
    return recipients;
  }

  // Certification: returned → notify teacher
  if (category === "certification_returned") {
    const teacherId = record.teacher_id as string | undefined;
    if (teacherId) recipients.push(teacherId);
    return recipients;
  }

  // Certification: issued → notify student
  if (category === "certification_issued") {
    const certStudentId = record.student_id as string | undefined;
    if (certStudentId) recipients.push(certStudentId);
    return recipients;
  }

  // Certification: rejected → notify teacher + supervisor
  if (category === "certification_rejected") {
    const teacherId = record.teacher_id as string | undefined;
    if (teacherId) recipients.push(teacherId);

    const programId = record.program_id as string | undefined;
    if (programId && teacherId) {
      const { data: roles } = await supabase
        .from("program_roles")
        .select("supervisor_id")
        .eq("profile_id", teacherId)
        .eq("program_id", programId)
        .not("supervisor_id", "is", null);

      if (roles) {
        for (const r of roles) {
          if (r.supervisor_id && !recipients.includes(r.supervisor_id)) {
            recipients.push(r.supervisor_id);
          }
        }
      }
    }
    return recipients;
  }

  // Certification: revoked → notify student + teacher + program admins
  if (category === "certification_revoked") {
    const certStudentId = record.student_id as string | undefined;
    const teacherId = record.teacher_id as string | undefined;
    const programId = record.program_id as string | undefined;

    if (certStudentId) recipients.push(certStudentId);
    if (teacherId && !recipients.includes(teacherId)) recipients.push(teacherId);

    if (programId) {
      const { data: admins } = await supabase
        .from("program_roles")
        .select("profile_id")
        .eq("program_id", programId)
        .eq("role", "program_admin");

      if (admins) {
        for (const a of admins) {
          if (!recipients.includes(a.profile_id)) {
            recipients.push(a.profile_id);
          }
        }
      }
    }
    return recipients;
  }

  // Himam: partner assigned → notify student
  if (category === "himam_partner_assigned") {
    const studentId = record.student_id as string | undefined;
    if (studentId) recipients.push(studentId);
    return recipients;
  }

  // Himam: event reminder → notify all registered students for the event
  if (category === "himam_event_reminder") {
    const eventId = record.event_id as string | undefined;
    if (!eventId) return recipients;

    const { data: registrations } = await supabase
      .from("himam_registrations")
      .select("student_id")
      .eq("event_id", eventId)
      .in("status", ["registered", "paired"]);

    if (registrations) {
      for (const reg of registrations) {
        if (!recipients.includes(reg.student_id)) {
          recipients.push(reg.student_id);
        }
      }
    }
    return recipients;
  }

  // Himam: event cancelled → notify all registered/paired students
  if (category === "himam_event_cancelled") {
    const eventId = record.event_id as string | undefined;
    if (!eventId) return recipients;

    const { data: registrations } = await supabase
      .from("himam_registrations")
      .select("student_id")
      .eq("event_id", eventId)
      .in("status", ["registered", "paired", "in_progress"]);

    if (registrations) {
      for (const reg of registrations) {
        if (!recipients.includes(reg.student_id)) {
          recipients.push(reg.student_id);
        }
      }
    }
    return recipients;
  }

  // Milestone badge earned: notify student directly
  if (category === "milestone_badge_earned") {
    const studentId = record.student_id as string | undefined;
    if (studentId) recipients.push(studentId);
    return recipients;
  }

  // Get the student's user ID (students.id = profiles.id)
  const studentId = record.student_id as string | undefined;
  if (!studentId) return recipients;

  // attendance_marked: parent only (no student notification)
  if (category !== "attendance_marked") {
    recipients.push(studentId);
  }

  // Look up parent
  const { data: student } = await supabase
    .from("students")
    .select("parent_id")
    .eq("id", studentId)
    .single();

  if (student?.parent_id) {
    recipients.push(student.parent_id);
  }

  return recipients;
}

// ─── Preference Check ───────────────────────────────────────────────────────

async function shouldSendToRecipient(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  category: NotificationCategory,
  schoolTimezone: string,
): Promise<boolean> {
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // No preferences row = all defaults (true)
  if (!prefs) return true;

  // Check if category is enabled
  // Map category to column name (voice_memo_attached uses voice_memo_received column)
  const categoryColumn = category === "voice_memo_attached" ? "voice_memo_received" : category as string;
  if (prefs[categoryColumn] === false) return false;

  // Check quiet hours
  if (prefs.quiet_hours_enabled && prefs.quiet_hours_start && prefs.quiet_hours_end) {
    const now = new Date();
    // Convert to school timezone for comparison
    const schoolTime = now.toLocaleTimeString("en-GB", {
      timeZone: schoolTimezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const start = prefs.quiet_hours_start.substring(0, 5);
    const end = prefs.quiet_hours_end.substring(0, 5);

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      if (schoolTime >= start || schoolTime < end) return false;
    } else {
      if (schoolTime >= start && schoolTime < end) return false;
    }
  }

  return true;
}

// ─── Content Builder ────────────────────────────────────────────────────────

async function buildNotificationContent(
  supabase: ReturnType<typeof createClient>,
  category: NotificationCategory,
  record: Record<string, unknown>,
  recipientId: string,
  isParent: boolean,
): Promise<{ title: string; body: string; data: Record<string, unknown> } | null> {
  // Get recipient's preferred language
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language, full_name")
    .eq("id", recipientId)
    .single();

  const lang = profile?.preferred_language === "ar" ? "ar" : "en";

  // Get child name for parent notifications
  let childName = "";
  if (isParent) {
    const studentId = record.student_id as string;
    const { data: childProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", studentId)
      .single();
    childName = childProfile?.full_name ?? "";
  }

  switch (category) {
    case "sticker_awarded": {
      const { data: sticker } = await supabase
        .from("stickers")
        .select("name")
        .eq("id", record.sticker_id as string)
        .single();
      const { data: teacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", record.awarded_by as string)
        .single();
      const stickerName = sticker?.name ?? "";
      const teacherName = teacher?.full_name ?? "";

      if (isParent) {
        return {
          title: lang === "ar" ? "ملصق جديد!" : "New Sticker!",
          body: lang === "ar"
            ? `${childName} حصل على ملصق "${stickerName}" من ${teacherName}`
            : `${childName} received "${stickerName}" from ${teacherName}`,
          data: { screen: "/(parent)/(tabs)/children" },
        };
      }
      return {
        title: lang === "ar" ? "ملصق جديد!" : "New Sticker!",
        body: lang === "ar"
          ? `${teacherName} منحك ملصق "${stickerName}"`
          : `${teacherName} awarded you "${stickerName}"`,
        data: { screen: "/(student)/(tabs)/stickers" },
      };
    }

    case "trophy_earned": {
      const { data: trophy } = await supabase
        .from("trophies")
        .select("name")
        .eq("id", record.trophy_id as string)
        .single();
      const trophyName = trophy?.name ?? "";

      if (isParent) {
        return {
          title: lang === "ar" ? "جائزة جديدة!" : "Trophy Earned!",
          body: lang === "ar"
            ? `${childName} حصل على جائزة: ${trophyName}!`
            : `${childName} earned a trophy: ${trophyName}!`,
          data: { screen: "/(parent)/(tabs)/children" },
        };
      }
      return {
        title: lang === "ar" ? "جائزة جديدة!" : "Trophy Earned!",
        body: lang === "ar"
          ? `حصلت على جائزة: ${trophyName}!`
          : `You earned a trophy: ${trophyName}!`,
        data: { screen: "/(student)/trophy-room" },
      };
    }

    case "achievement_unlocked": {
      const { data: achievement } = await supabase
        .from("achievements")
        .select("name")
        .eq("id", record.achievement_id as string)
        .single();
      const achievementName = achievement?.name ?? "";

      if (isParent) {
        return {
          title: lang === "ar" ? "إنجاز جديد!" : "Achievement Unlocked!",
          body: lang === "ar"
            ? `${childName} حقق إنجاز: ${achievementName}!`
            : `${childName} unlocked: ${achievementName}!`,
          data: { screen: "/(parent)/(tabs)/children" },
        };
      }
      return {
        title: lang === "ar" ? "إنجاز جديد!" : "Achievement Unlocked!",
        body: lang === "ar"
          ? `حققت إنجاز: ${achievementName}!`
          : `You unlocked: ${achievementName}!`,
        data: { screen: "/(student)/(tabs)/stickers" },
      };
    }

    case "attendance_marked": {
      // Parent only
      const status = record.status as string;
      const statusLabels: Record<string, Record<string, string>> = {
        present: { en: "present", ar: "حاضر" },
        absent: { en: "absent", ar: "غائب" },
        late: { en: "late", ar: "متأخر" },
        excused: { en: "excused", ar: "معذور" },
      };
      const statusLabel = statusLabels[status]?.[lang] ?? status;

      return {
        title: lang === "ar" ? "تسجيل حضور" : "Attendance Update",
        body: lang === "ar"
          ? `${childName} تم تسجيله ${statusLabel} اليوم`
          : `${childName} was marked ${statusLabel} today`,
        data: {
          screen: "/(parent)/(tabs)/children",
        },
      };
    }

    case "session_completed": {
      const memScore = record.memorization_score as number | null;
      const tajScore = record.tajweed_score as number | null;
      const recScore = record.recitation_quality as number | null;
      const scores = [memScore, tajScore, recScore].filter((s) => s != null);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

      if (isParent) {
        return {
          title: lang === "ar" ? "حصة مكتملة" : "Session Completed",
          body: lang === "ar"
            ? `${childName} أكمل حصة${avgScore != null ? ` — متوسط: ${avgScore}/10` : ""}`
            : `${childName} completed a session${avgScore != null ? ` — avg: ${avgScore}/10` : ""}`,
          data: { screen: "/(parent)/(tabs)/children" },
        };
      }
      return {
        title: lang === "ar" ? "حصة مكتملة" : "Session Completed",
        body: lang === "ar"
          ? `أكملت حصة جديدة${avgScore != null ? ` — متوسط: ${avgScore}/10` : ""}`
          : `You completed a session${avgScore != null ? ` — avg: ${avgScore}/10` : ""}`,
        data: { screen: "/(student)/sessions/index" },
      };
    }

    case "voice_memo_attached": {
      const sessionId = record.session_id as string;
      const teacherId = record.teacher_id as string;
      const { data: teacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", teacherId)
        .single();
      const teacherName = teacher?.full_name ?? "";

      if (isParent) {
        return {
          title: lang === "ar" ? "رسالة صوتية جديدة" : "New Voice Memo",
          body: lang === "ar"
            ? `${teacherName} أرسل رسالة صوتية لـ${childName}`
            : `${teacherName} sent a voice memo for ${childName}`,
          data: { screen: `/(parent)/sessions/${sessionId}` },
        };
      }
      return {
        title: lang === "ar" ? "رسالة صوتية جديدة" : "New Voice Memo",
        body: lang === "ar"
          ? `${teacherName} أرسل لك رسالة صوتية`
          : `${teacherName} sent you a voice memo`,
        data: { screen: `/(student)/sessions/${sessionId}` },
      };
    }

    case "teacher_demand": {
      const demandProgramId = record.program_id as string;
      const waitingCount = record.waiting_count as number;
      const { data: demandProgram } = await supabase
        .from("programs")
        .select("name, name_ar")
        .eq("id", demandProgramId)
        .single();
      const programName = lang === "ar"
        ? (demandProgram?.name_ar ?? demandProgram?.name ?? "")
        : (demandProgram?.name ?? "");

      return {
        title: lang === "ar" ? "طلاب بانتظارك" : "Students Are Waiting",
        body: lang === "ar"
          ? `${waitingCount} طالب بانتظار معلم في ${programName}`
          : `${waitingCount} students are waiting for a teacher in ${programName}`,
        data: {
          screen: "/(teacher)/availability",
        },
      };
    }

    case "queue_available": {
      const entryId = record.entry_id as string;
      const queueTeacherId = record.teacher_id as string;
      const { data: queueTeacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", queueTeacherId)
        .single();
      const queueTeacherName = queueTeacher?.full_name ?? "";

      return {
        title: lang === "ar" ? "معلم متاح الآن!" : "Teacher Available Now!",
        body: lang === "ar"
          ? `${queueTeacherName} متاح الآن — لديك ٣ دقائق للانضمام`
          : `${queueTeacherName} is available — you have 3 minutes to claim`,
        data: {
          screen: `/(student)/queue/claim/${entryId}`,
          deepLink: `werecitetogether://queue/claim/${entryId}`,
        },
      };
    }

    case "rating_prompt": {
      const ratingSessionId = record.id as string;
      return {
        title: lang === "ar" ? "كيف كانت جلستك؟" : "How was your session?",
        body: lang === "ar"
          ? "شاركنا رأيك عن جلستك الأخيرة"
          : "Share your feedback about your recent session",
        data: { screen: `/(student)/sessions/${ratingSessionId}` },
      };
    }

    case "flagged_review_alert": {
      const ratedTeacherId = record.teacher_id as string;
      const starRating = record.star_rating as number;
      const { data: ratedTeacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", ratedTeacherId)
        .single();
      const ratedTeacherName = ratedTeacher?.full_name ?? "";

      return {
        title: lang === "ar" ? "تقييم منخفض مُبلَّغ" : "Low Rating Flagged",
        body: lang === "ar"
          ? `${ratedTeacherName} حصل على تقييم ${starRating} نجوم — يحتاج مراجعة`
          : `${ratedTeacherName} received a ${starRating}-star rating — needs review`,
        data: {
          screen: `/(supervisor)/teachers/${ratedTeacherId}/reviews`,
        },
      };
    }

    case "low_rating_alert": {
      const alertTeacherId = record.teacher_id as string;
      const avgRating = record.average_rating as number;
      const { data: alertTeacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", alertTeacherId)
        .single();
      const alertTeacherName = alertTeacher?.full_name ?? "";

      return {
        title: lang === "ar" ? "تنبيه تقييم منخفض" : "Low Rating Alert",
        body: lang === "ar"
          ? `متوسط تقييم ${alertTeacherName} انخفض إلى ${avgRating.toFixed(1)} — أقل من 3.5`
          : `${alertTeacherName}'s average rating dropped to ${avgRating.toFixed(1)} — below 3.5 threshold`,
        data: {
          screen: `/(supervisor)/teachers/${alertTeacherId}/reviews`,
        },
      };
    }

    case "recovered_alert": {
      const recTeacherId = record.teacher_id as string;
      const recAvgRating = record.average_rating as number;
      const { data: recTeacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", recTeacherId)
        .single();
      const recTeacherName = recTeacher?.full_name ?? "";

      return {
        title: lang === "ar" ? "تحسّن التقييم" : "Rating Recovered",
        body: lang === "ar"
          ? `متوسط تقييم ${recTeacherName} تحسّن إلى ${recAvgRating.toFixed(1)} — فوق 3.5`
          : `${recTeacherName}'s average rating recovered to ${recAvgRating.toFixed(1)} — above 3.5 threshold`,
        data: {
          screen: `/(supervisor)/teachers/${recTeacherId}/reviews`,
        },
      };
    }

    case "supervisor_flag": {
      const flagTeacherId = record.teacher_id as string;
      const flagNote = record.note as string | undefined;
      const flagSupervisorId = record.supervisor_id as string;
      const { data: flagTeacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", flagTeacherId)
        .single();
      const { data: flagSupervisor } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", flagSupervisorId)
        .single();
      const flagTeacherName = flagTeacher?.full_name ?? "";
      const flagSupervisorName = flagSupervisor?.full_name ?? "";
      const notePreview = flagNote
        ? (flagNote.length > 80 ? flagNote.substring(0, 80) + "…" : flagNote)
        : "";

      return {
        title: lang === "ar" ? "إبلاغ من مشرف" : "Supervisor Flag",
        body: lang === "ar"
          ? `${flagSupervisorName} أبلغ عن مشكلة مع ${flagTeacherName}${notePreview ? `: ${notePreview}` : ""}`
          : `${flagSupervisorName} flagged an issue with ${flagTeacherName}${notePreview ? `: ${notePreview}` : ""}`,
        data: {
          screen: `/(program-admin)/teachers/${flagTeacherId}`,
        },
      };
    }

    case "certification_recommended": {
      const certStudentId = record.student_id as string;
      const { data: certStudent } = await supabase
        .from("profiles").select("full_name").eq("id", certStudentId).single();
      const certStudentName = certStudent?.full_name ?? "";
      const certTitle = record.title as string ?? "";

      return {
        title: lang === "ar" ? "ترشيح جديد للشهادة" : "New Certification Recommendation",
        body: lang === "ar"
          ? `${certStudentName} مرشح للشهادة: ${certTitle}`
          : `${certStudentName} recommended for: ${certTitle}`,
        data: { screen: "/(supervisor)/certifications" },
      };
    }

    case "certification_supervisor_approved": {
      const certTitle = record.title as string ?? "";
      return {
        title: lang === "ar" ? "ترشيح جاهز للإصدار" : "Certification Ready for Issuance",
        body: lang === "ar"
          ? `ترشيح "${certTitle}" تمت الموافقة عليه من المشرف`
          : `"${certTitle}" approved by supervisor — ready to issue`,
        data: { screen: "/(program-admin)/certifications" },
      };
    }

    case "certification_returned": {
      const certTitle = record.title as string ?? "";
      const reviewNotes = record.review_notes as string | undefined;
      const notePreview = reviewNotes
        ? (reviewNotes.length > 60 ? reviewNotes.substring(0, 60) + "…" : reviewNotes)
        : "";

      return {
        title: lang === "ar" ? "ترشيح مُعاد" : "Certification Returned",
        body: lang === "ar"
          ? `"${certTitle}" أُعيد للمراجعة${notePreview ? `: ${notePreview}` : ""}`
          : `"${certTitle}" returned for revision${notePreview ? `: ${notePreview}` : ""}`,
        data: { screen: "/(teacher)/certifications" },
      };
    }

    case "certification_issued": {
      const certTitle = record.title as string ?? "";
      const certNumber = record.certificate_number as string ?? "";

      return {
        title: lang === "ar" ? "تم إصدار شهادتك!" : "Certificate Issued!",
        body: lang === "ar"
          ? `شهادة "${certTitle}" صدرت — رقم: ${certNumber}`
          : `"${certTitle}" has been issued — #${certNumber}`,
        data: { screen: "/(student)/certificates" },
      };
    }

    case "certification_rejected": {
      const certTitle = record.title as string ?? "";
      return {
        title: lang === "ar" ? "ترشيح مرفوض" : "Certification Rejected",
        body: lang === "ar"
          ? `ترشيح "${certTitle}" تم رفضه`
          : `"${certTitle}" has been rejected`,
        data: { screen: "/(teacher)/certifications" },
      };
    }

    case "certification_revoked": {
      const certTitle = record.title as string ?? "";
      const revokeReason = record.revocation_reason as string | undefined;
      const reasonPreview = revokeReason
        ? (revokeReason.length > 60 ? revokeReason.substring(0, 60) + "…" : revokeReason)
        : "";

      return {
        title: lang === "ar" ? "شهادة مُلغاة" : "Certificate Revoked",
        body: lang === "ar"
          ? `شهادة "${certTitle}" تم إلغاؤها${reasonPreview ? `: ${reasonPreview}` : ""}`
          : `"${certTitle}" has been revoked${reasonPreview ? `: ${reasonPreview}` : ""}`,
        data: { screen: "/(student)/certificates" },
      };
    }

    case "himam_partner_assigned": {
      const partnerName = record.partner_name as string ?? "";
      return {
        title: lang === "ar" ? "تم تعيين شريكك" : "Partner Assigned",
        body: lang === "ar"
          ? `شريكك في ماراثون همم هو ${partnerName}`
          : `Your Himam marathon partner is ${partnerName}`,
        data: { screen: "/(student)/himam" },
      };
    }

    case "himam_event_reminder": {
      const eventDate = record.event_date as string ?? "";
      return {
        title: lang === "ar" ? "تذكير ماراثون همم" : "Himam Marathon Reminder",
        body: lang === "ar"
          ? `ماراثون همم يبدأ غداً ${eventDate}. سجّل الآن!`
          : `Himam marathon starts tomorrow ${eventDate}. Register now!`,
        data: { screen: "/(student)/himam" },
      };
    }

    case "himam_event_cancelled": {
      const eventDate = record.event_date as string ?? "";
      return {
        title: lang === "ar" ? "إلغاء ماراثون همم" : "Himam Marathon Cancelled",
        body: lang === "ar"
          ? `تم إلغاء ماراثون همم بتاريخ ${eventDate}`
          : `Himam marathon on ${eventDate} has been cancelled`,
        data: { screen: "/(student)/himam" },
      };
    }

    case "milestone_badge_earned": {
      const badgeName = lang === "ar"
        ? (record.badge_name_ar as string ?? "")
        : (record.badge_name_en as string ?? "");
      return {
        title: lang === "ar" ? "وسام جديد!" : "New Badge Earned!",
        body: lang === "ar"
          ? `حصلت على وسام: ${badgeName}`
          : `You earned a badge: ${badgeName}`,
        data: { screen: "/(student)/profile/badges" },
      };
    }

    default:
      return null;
  }
}

// ─── Expo Push API ──────────────────────────────────────────────────────────

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (expoAccessToken) {
    headers["Authorization"] = `Bearer ${expoAccessToken}`;
  }

  const allTickets: ExpoPushTicket[] = [];

  // Batch in groups of 100
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      console.error("[send-notification] Expo Push API error:", response.status);
      continue;
    }

    const result = await response.json();
    const tickets = result.data as ExpoPushTicket[];
    allTickets.push(...tickets);
  }

  return allTickets;
}

// ─── Handle Invalid Tokens ──────────────────────────────────────────────────

async function handleInvalidTokens(
  supabase: ReturnType<typeof createClient>,
  tokens: string[],
  tickets: ExpoPushTicket[],
) {
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
      const token = tokens[i];
      if (token) {
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .eq("token", token);
      }
    }
  }
}

// ─── Receipt Checking ──────────────────────────────────────────────────

async function checkReceipts(
  supabase: ReturnType<typeof createClient>,
  tickets: ExpoPushTicket[],
  tokens: string[],
) {
  const ticketIds = tickets
    .map((t) => t.id)
    .filter((id): id is string => !!id);

  if (ticketIds.length === 0) return;

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (expoAccessToken) {
    headers["Authorization"] = `Bearer ${expoAccessToken}`;
  }

  // Expo recommends waiting 15 minutes; we do a best-effort inline check
  // after a short delay since Edge Functions have limited execution time
  await new Promise((resolve) => setTimeout(resolve, 5_000));

  const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
    method: "POST",
    headers,
    body: JSON.stringify({ ids: ticketIds }),
  });

  if (!response.ok) {
    console.error("[send-notification] Receipt check failed:", response.status);
    return;
  }

  const result = await response.json();
  const receipts = result.data as Record<string, ExpoPushReceipt>;

  // Map ticket IDs back to tokens for deactivation
  const ticketIdToToken = new Map<string, string>();
  for (let i = 0; i < tickets.length; i++) {
    if (tickets[i].id && tokens[i]) {
      ticketIdToToken.set(tickets[i].id!, tokens[i]);
    }
  }

  for (const [ticketId, receipt] of Object.entries(receipts)) {
    if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
      const token = ticketIdToToken.get(ticketId);
      if (token) {
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .eq("token", token);
      }
    }
  }
}

// ─── Dedup Check ───────────────────────────────────────────────────────

function isDuplicate(recipientId: string, category: string): boolean {
  const key = `${recipientId}:${category}`;
  const lastSent = recentSends.get(key);
  const now = Date.now();

  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) return true;

  recentSends.set(key, now);
  if (recentSends.size > 1000) {
    for (const [k, v] of recentSends) {
      if (now - v >= DEDUP_WINDOW_MS) recentSends.delete(k);
    }
  }

  return false;
}

async function getProfileLanguage(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
): Promise<"en" | "ar"> {
  const { data } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", profileId)
    .single();
  return data?.preferred_language === "ar" ? "ar" : "en";
}

async function getActiveTokens(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("profile_id", profileId);
  return (data ?? []).map((t: { token: string }) => t.token);
}

async function isPreferenceEnabled(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  category: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("profile_id", profileId)
    .eq("category", category)
    .maybeSingle();
  return data?.enabled ?? true;
}

function buildContent(
  category: NotificationCategory,
  record: Record<string, unknown>,
  lang: "en" | "ar",
): { title: string; body: string; data: Record<string, unknown> } | null {
  switch (category) {
    case "session_completed":
      return {
        title: lang === "ar" ? "حصة مكتملة" : "Session Completed",
        body: lang === "ar"
          ? "أكمل المعلم تسجيل جلسة التلاوة"
          : "Your teacher completed the session log",
        data: { screen: "/(student)/(tabs)/index" },
      };

    case "enrollment_approved":
      return {
        title: lang === "ar" ? "تم قبول التسجيل" : "Enrollment Approved",
        body: lang === "ar"
          ? "تم قبول تسجيلك في البرنامج"
          : "Your enrollment has been approved",
        data: { screen: "/(student)/(tabs)/index" },
      };

    case "waitlist_offer":
      return {
        title: lang === "ar" ? "مكان متاح!" : "Spot Available!",
        body: lang === "ar"
          ? "مكان أصبح متاحاً في قائمة الانتظار"
          : "A spot has opened up from the waitlist",
        data: { screen: "/(student)/(tabs)/index" },
      };

    case "cohort_update":
      return {
        title: lang === "ar" ? "تحديث المجموعة" : "Cohort Update",
        body: lang === "ar"
          ? "تم تحديث حالة مجموعتك"
          : "Your cohort status has been updated",
        data: { screen: "/(student)/(tabs)/index" },
      };

    case "voice_memo_received":
      return {
        title: lang === "ar" ? "رسالة صوتية" : "Voice Memo",
        body: lang === "ar"
          ? "ترك لك المعلم رسالة صوتية"
          : "Your teacher left you a voice memo",
        data: { screen: "/(student)/(tabs)/index" },
      };

    case "rating_prompt":
      return {
        title: lang === "ar" ? "قيّم جلستك" : "Rate Your Session",
        body: lang === "ar"
          ? "كيف كانت جلستك؟ اضغط لتقييم"
          : "How was your session? Tap to rate",
        data: { screen: "/(student)/(tabs)/index" },
      };

    case "queue_threshold":
      return {
        title: lang === "ar" ? "طلاب بالانتظار" : "Students Waiting",
        body: lang === "ar"
          ? "هناك طلاب ينتظرون — هل يمكنك الانضمام؟"
          : "Students are waiting — can you come online?",
        data: { screen: "/(teacher)/(tabs)/index" },
      };

    case "supervisor_alert": {
      const rating = record.rating as number | undefined;
      return {
        title: lang === "ar" ? "تنبيه مشرف" : "Supervisor Alert",
        body: lang === "ar"
          ? `تقييم جديد منخفض (${rating ?? "N/A"}/5) يحتاج مراجعة`
          : `New low rating (${rating ?? "N/A"}/5) needs review`,
        data: { screen: "/(supervisor)/(tabs)/index" },
      };
    }

    default:
      return null;
  }
}

/**
 * For children's program students, find guardians who should also receive
 * this notification category and return their push tokens.
 */
async function getGuardianTokens(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  category: string,
): Promise<string[]> {
  const guardianCategory = GUARDIAN_CATEGORY_MAP[category];
  if (!guardianCategory) return [];

  // Get guardians for this student
  const { data: guardians } = await supabase
    .from("student_guardians")
    .select("id")
    .eq("student_id", studentId);

  if (!guardians || guardians.length === 0) return [];

  const guardianIds = guardians.map((g: { id: string }) => g.id);

  // Check which guardians have this notification category enabled
  const { data: prefs } = await supabase
    .from("guardian_notification_preferences")
    .select("guardian_id")
    .in("guardian_id", guardianIds)
    .eq("category", guardianCategory)
    .eq("enabled", false);

  // Guardians who explicitly disabled this category
  const disabledGuardianIds = new Set(
    (prefs ?? []).map((p: { guardian_id: string }) => p.guardian_id),
  );

  // Get tokens for guardians who haven't disabled this category
  // Guardians share the student's push tokens (they receive on the student's device)
  // For now, we just send to the student's tokens — guardian-specific push tokens
  // would require a separate guardian app or guardian profile with their own tokens
  // This is a no-op until guardian-specific devices are supported
  return [];
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (expoAccessToken) headers["Authorization"] = `Bearer ${expoAccessToken}`;

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // Determine if this is a direct notification (pg_net) or a standard webhook
    let activeCategories: NotificationCategory[];
    let record: Record<string, unknown>;

    if (DIRECT_CATEGORIES.has(payload.type)) {
      // Direct notification from pg_net (e.g., low_rating_alert, recovered_alert)
      activeCategories = [payload.type as NotificationCategory];
      record = payload;
    } else {
      // Standard webhook payload
      const webhookPayload = payload as WebhookPayload;
      const { table } = webhookPayload;
      record = webhookPayload.record;

      const allCategories = TABLE_TO_CATEGORIES[table];
      if (!allCategories || allCategories.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: `Unknown table: ${table}` }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      activeCategories = getActiveCategories(allCategories, record);
    }
    if (activeCategories.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseAdmin();

    // Get school timezone for quiet hours check
    let resolvedStudentId = record.student_id as string | undefined;

    // For voice memos, look up student_id from the session
    if (!resolvedStudentId && record.session_id) {
      const { data: memoSession } = await supabase
        .from("sessions")
        .select("student_id")
        .eq("id", record.session_id as string)
        .single();
      resolvedStudentId = memoSession?.student_id ?? undefined;
    }

    const { data: student } = resolvedStudentId
      ? await supabase
          .from("students")
          .select("school_id")
          .eq("id", resolvedStudentId)
          .single()
      : { data: null };
    const { data: school } = await supabase
      .from("schools")
      .select("timezone")
      .eq("id", student?.school_id ?? "")
      .single();
    const schoolTimezone = school?.timezone ?? "UTC";

    // Build and send notifications for all active categories
    const messages: ExpoPushMessage[] = [];
    const tokensList: string[] = [];
    let skipped = 0;

    for (const category of activeCategories) {
      const recipientIds = await getRecipients(supabase, category, record);

      for (const recipientId of recipientIds) {
        // Dedup: skip if same recipient+category sent within 30 seconds
        if (isDuplicate(recipientId, category)) {
          skipped++;
          continue;
        }

        // Check preferences
        const shouldSend = await shouldSendToRecipient(supabase, recipientId, category, schoolTimezone);
        if (!shouldSend) {
          skipped++;
          continue;
        }

        // Get push tokens
        const { data: tokens } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", recipientId)
          .eq("is_active", true);

        if (!tokens || tokens.length === 0) {
          skipped++;
          continue;
        }

        // Build content
        const isParent = recipientId !== (resolvedStudentId ?? record.student_id);
        const content = await buildNotificationContent(
          supabase, category, record, recipientId, isParent,
        );
        if (!content) {
          skipped++;
          continue;
        }

        // Create messages for each device
        for (const { token } of tokens) {
          messages.push({
            to: token,
            title: content.title,
            body: content.body,
            data: content.data,
            sound: "default",
            priority: "high",
            channelId: "default",
          });
          tokensList.push(token);
        }
      }
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "dedup" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const enabled = await isPreferenceEnabled(supabase, recipientId, category);
    if (!enabled) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "disabled" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const tokens = await getActiveTokens(supabase, recipientId);

    // Also collect guardian tokens for children's program notifications
    const guardianTokens = await getGuardianTokens(supabase, recipientId, category);
    const allTokens = [...tokens, ...guardianTokens];

    if (allTokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "no_tokens" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const lang = await getProfileLanguage(supabase, recipientId);
    const content = buildContent(category, record, lang);
    if (!content) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "no_content" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const messages: ExpoPushMessage[] = allTokens.map((token) => ({
      to: token,
      title: content.title,
      body: content.body,
      data: content.data,
      sound: "default",
      priority: "high",
      categoryId: category,
    }));

    await sendExpoPush(messages);

    return new Response(
      JSON.stringify({ sent: messages.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
