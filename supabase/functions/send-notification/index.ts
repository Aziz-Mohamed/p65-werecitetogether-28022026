import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
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
  | "supervisor_alert";

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

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

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
    const payload = (await req.json()) as WebhookPayload;
    const { table, record } = payload;

    const category = TABLE_TO_CATEGORY[table];
    if (!category) {
      return new Response(
        JSON.stringify({ error: `Unknown table: ${table}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseAdmin();

    // Determine recipient based on category
    const recipientId = (record.student_id ?? record.profile_id) as string | undefined;
    if (!recipientId) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (isDuplicate(recipientId, category)) {
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
    if (tokens.length === 0) {
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

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
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
