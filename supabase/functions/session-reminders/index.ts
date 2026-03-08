import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Supabase Client ────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ─── Expo Push ──────────────────────────────────────────────────────────────

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (expoAccessToken) {
    headers["Authorization"] = `Bearer ${expoAccessToken}`;
  }
  const allTickets: ExpoPushTicket[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });
    if (response.ok) {
      const result = await response.json();
      allTickets.push(...(result.data as ExpoPushTicket[]));
    } else {
      console.error("[session-reminders] Expo Push error:", response.status);
    }
  }
  return allTickets;
}

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
        await supabase.from("push_tokens").update({ is_active: false }).eq("token", token);
      }
    }
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────
// Called by pg_cron every 15 minutes. Finds scheduled_sessions starting
// within the next 30 minutes and sends push reminders to teacher + student.

Deno.serve(async (_req: Request) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get today's date and current time in UTC
    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];

    // Find sessions starting within the next 15–45 minute window
    // (the function runs every 15 min, so we look 30 min ahead with some buffer)
    const windowStart = new Date(now.getTime() + 15 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 45 * 60 * 1000);

    const startTime = windowStart.toISOString().split("T")[1].substring(0, 8);
    const endTime = windowEnd.toISOString().split("T")[1].substring(0, 8);

    const { data: sessions, error: sessionsError } = await supabase
      .from("scheduled_sessions")
      .select(
        "id, start_time, session_type, teacher_id, student_id, title",
      )
      .eq("session_date", todayISO)
      .eq("status", "scheduled")
      .gte("start_time", startTime)
      .lte("start_time", endTime);

    if (sessionsError) {
      console.error("[session-reminders] Query error:", sessionsError);
      return new Response(
        JSON.stringify({ success: false, error: sessionsError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reminders_sent: 0, reason: "no_upcoming_sessions" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const messages: ExpoPushMessage[] = [];
    const tokensList: string[] = [];

    // Collect unique user IDs to fetch tokens and preferences in batch
    const userIds = new Set<string>();
    for (const session of sessions) {
      userIds.add(session.teacher_id);
      if (session.student_id) userIds.add(session.student_id);
    }

    // Fetch tokens for all relevant users
    const { data: allTokens } = await supabase
      .from("push_tokens")
      .select("user_id, token")
      .in("user_id", [...userIds])
      .eq("is_active", true);

    const tokensByUser = new Map<string, string[]>();
    for (const t of allTokens ?? []) {
      const existing = tokensByUser.get(t.user_id) ?? [];
      existing.push(t.token);
      tokensByUser.set(t.user_id, existing);
    }

    // Fetch preferred language for all users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, preferred_language")
      .in("id", [...userIds]);

    const profileMap = new Map<string, { full_name: string; lang: string }>();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        full_name: p.full_name,
        lang: p.preferred_language === "ar" ? "ar" : "en",
      });
    }

    // Build messages
    for (const session of sessions) {
      const timeFormatted = session.start_time.substring(0, 5); // HH:MM
      const sessionLabel = session.title ?? (session.session_type === "class" ? "Class" : "Individual");

      // Notify teacher
      const teacherTokens = tokensByUser.get(session.teacher_id) ?? [];
      const teacherProfile = profileMap.get(session.teacher_id);
      if (teacherTokens.length > 0 && teacherProfile) {
        const isAr = teacherProfile.lang === "ar";
        for (const token of teacherTokens) {
          messages.push({
            to: token,
            title: isAr ? "تذكير بالجلسة" : "Session Reminder",
            body: isAr
              ? `جلستك "${sessionLabel}" تبدأ في الساعة ${timeFormatted}`
              : `Your "${sessionLabel}" session starts at ${timeFormatted}`,
            data: { screen: "/(teacher)/(tabs)/index" },
            sound: "default",
            priority: "high",
            channelId: "reminders",
          });
          tokensList.push(token);
        }
      }

      // Notify student (individual sessions)
      if (session.student_id) {
        const studentTokens = tokensByUser.get(session.student_id) ?? [];
        const studentProfile = profileMap.get(session.student_id);
        if (studentTokens.length > 0 && studentProfile) {
          const isAr = studentProfile.lang === "ar";
          for (const token of studentTokens) {
            messages.push({
              to: token,
              title: isAr ? "تذكير بالجلسة" : "Session Reminder",
              body: isAr
                ? `جلستك تبدأ في الساعة ${timeFormatted}`
                : `Your session starts at ${timeFormatted}`,
              data: { screen: "/(student)/(tabs)/index" },
              sound: "default",
              priority: "high",
              channelId: "reminders",
            });
            tokensList.push(token);
          }
        }
      }
    }

    const tickets = await sendExpoPush(messages);
    await handleInvalidTokens(supabase, tokensList, tickets);

    return new Response(
      JSON.stringify({
        success: true,
        sessions_found: sessions.length,
        reminders_sent: messages.length,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[session-reminders] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
