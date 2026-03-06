import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
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

Deno.serve(async (_req: Request) => {
  try {
    const supabase = getSupabaseAdmin();

    // Query expired drafts grouped by teacher
    const { data: expiredDrafts, error: queryError } = await supabase
      .from("sessions")
      .select("id, teacher_id")
      .eq("status", "draft")
      .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!expiredDrafts || expiredDrafts.length === 0) {
      return new Response(
        JSON.stringify({ teachers_notified: 0, drafts_deleted: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Group by teacher
    const teacherDrafts = new Map<string, string[]>();
    for (const draft of expiredDrafts) {
      const ids = teacherDrafts.get(draft.teacher_id) ?? [];
      ids.push(draft.id);
      teacherDrafts.set(draft.teacher_id, ids);
    }

    // Delete expired drafts
    const draftIds = expiredDrafts.map((d) => d.id);
    const { error: deleteError } = await supabase
      .from("sessions")
      .delete()
      .in("id", draftIds);

    if (deleteError) {
      throw new Error(`Delete error: ${deleteError.message}`);
    }

    // Send batched push notification per teacher
    let teachersNotified = 0;
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

    for (const [teacherId, deletedIds] of teacherDrafts) {
      const count = deletedIds.length;

      // Check notification preference
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("draft_expired")
        .eq("user_id", teacherId)
        .maybeSingle();

      if (prefs?.draft_expired === false) continue;

      // Get preferred language
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", teacherId)
        .single();

      const lang = profile?.preferred_language === "ar" ? "ar" : "en";

      // Get push tokens
      const { data: tokens } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", teacherId)
        .eq("is_active", true);

      if (!tokens || tokens.length === 0) continue;

      const messages: ExpoPushMessage[] = tokens.map(({ token }) => ({
        to: token,
        title: lang === "ar" ? "مسودات محذوفة" : "Drafts Removed",
        body: lang === "ar"
          ? `تم حذف ${count} جلسة/جلسات مسودة بعد ٧ أيام`
          : `${count} draft session(s) were removed after 7 days`,
        data: { screen: "/(teacher)/(tabs)/sessions" },
        sound: "default" as const,
        priority: "default" as const,
        channelId: "default",
      }));

      // Send via Expo Push API
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (expoAccessToken) {
        headers["Authorization"] = `Bearer ${expoAccessToken}`;
      }

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers,
        body: JSON.stringify(messages),
      });

      teachersNotified++;
    }

    return new Response(
      JSON.stringify({
        teachers_notified: teachersNotified,
        drafts_deleted: draftIds.length,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[cleanup-drafts] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
