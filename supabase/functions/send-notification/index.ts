import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: "INSERT";
  table: string;
  schema: "public";
  record: Record<string, unknown>;
  old_record: null;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

// ─── Dedup Cache (in-memory, per isolate lifetime) ─────────────────────────

const recentSends = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000;

type NotificationCategory =
  | "sticker_awarded"
  | "trophy_earned"
  | "achievement_unlocked"
  | "attendance_marked"
  | "session_completed"
  | "voice_memo_attached";

// ─── Table → Category Mapping ───────────────────────────────────────────────

const TABLE_TO_CATEGORY: Record<string, NotificationCategory> = {
  student_stickers: "sticker_awarded",
  student_trophies: "trophy_earned",
  student_achievements: "achievement_unlocked",
  attendance: "attendance_marked",
  sessions: "session_completed",
  session_voice_memos: "voice_memo_attached",
};

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

  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
    return true;
  }

  recentSends.set(key, now);

  // Prune old entries to prevent unbounded growth
  if (recentSends.size > 1000) {
    for (const [k, v] of recentSends) {
      if (now - v >= DEDUP_WINDOW_MS) recentSends.delete(k);
    }
  }

  return false;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const { table, record } = payload;

    const category = TABLE_TO_CATEGORY[table];
    if (!category) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown table: ${table}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseAdmin();

    // Get recipients
    const recipientIds = await getRecipients(supabase, category, record);
    if (recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, skipped: 0, errors: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

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

    // Build and send notifications
    const messages: ExpoPushMessage[] = [];
    const tokensList: string[] = [];
    let skipped = 0;

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

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, skipped, errors: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Send via Expo Push API
    const tickets = await sendExpoPush(messages);

    // Handle invalid tokens from immediate ticket errors
    await handleInvalidTokens(supabase, tokensList, tickets);

    // Best-effort receipt check (handles delayed DeviceNotRegistered)
    checkReceipts(supabase, tickets, tokensList).catch((e) =>
      console.error("[send-notification] Receipt check error:", e)
    );

    const errorCount = tickets.filter((t) => t.status === "error").length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: messages.length - errorCount,
        skipped,
        errors: errorCount,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-notification] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
