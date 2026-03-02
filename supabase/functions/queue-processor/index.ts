import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CLAIM_WINDOW_MINUTES = 3;
const DEFAULT_TEACHER_NOTIFY_THRESHOLD = 5;

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the program_id and optional teacher info from the request body
    const { program_id, teacher_id } = await req.json();

    if (!program_id) {
      return new Response(
        JSON.stringify({ error: "program_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Count waiting queue entries BEFORE advancing (for threshold detection)
    const { count: queueSizeBefore } = await supabase
      .from("free_program_queue")
      .select("*", { count: "exact", head: true })
      .eq("program_id", program_id)
      .eq("status", "waiting");

    // Find first waiting queue entry for this program
    const { data: entry, error: fetchError } = await supabase
      .from("free_program_queue")
      .select("*")
      .eq("program_id", program_id)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!entry) {
      return new Response(
        JSON.stringify({ message: "No students waiting in queue" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Update to notified with expiry
    const expiresAt = new Date(
      Date.now() + CLAIM_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const { error: updateError } = await supabase
      .from("free_program_queue")
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq("id", entry.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch teacher profile for enriched notification data
    let teacherName = "";
    let teacherPlatform = "";
    if (teacher_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, full_name, meeting_platform")
        .eq("id", teacher_id)
        .single();
      if (profile) {
        teacherName = profile.display_name ?? profile.full_name ?? "";
        teacherPlatform = profile.meeting_platform ?? "";
      }
    }

    // Get student's push token
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("profile_id", entry.student_id);

    if (tokens && tokens.length > 0) {
      // Send push notification via Expo Push API with enriched data
      const messages = tokens.map((tk: { token: string }) => ({
        to: tk.token,
        title: "A teacher is available!",
        body: `Tap to join your session. You have ${CLAIM_WINDOW_MINUTES} minutes to claim your spot.`,
        data: {
          screen: "/(student)/queue-claim",
          params: { queueEntryId: entry.id, programId: program_id },
          teacherName,
          platform: teacherPlatform,
          expiresAt,
        },
        categoryId: "queue_available",
      }));

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });
    }

    // --- Teacher threshold notification (FR-011) ---
    // Notify offline teachers when the queue grows past the threshold.
    // The threshold check uses the BEFORE count: if a new student just joined
    // and pushed the queue past the threshold, this processor was invoked by
    // the teacher going available (which pops one student). So we check the
    // pre-advance count against the threshold.
    const { data: program } = await supabase
      .from("programs")
      .select("settings")
      .eq("id", program_id)
      .single();

    const threshold =
      (program?.settings as Record<string, unknown> | null)
        ?.notify_teachers_queue_threshold as number | undefined ??
      DEFAULT_TEACHER_NOTIFY_THRESHOLD;

    const beforeCount = queueSizeBefore ?? 0;

    // Trigger when the queue was at/above threshold before this advance.
    // This means there are many students waiting — notify offline teachers.
    if (beforeCount >= threshold) {
      // Find offline teachers for this program
      const { data: offlineTeachers } = await supabase
        .from("teacher_availability")
        .select("teacher_id")
        .eq("program_id", program_id)
        .eq("is_available", false);

      if (offlineTeachers && offlineTeachers.length > 0) {
        // Send notification to each offline teacher via send-notification
        for (const teacher of offlineTeachers) {
          await supabase.functions.invoke("send-notification", {
            body: {
              user_id: teacher.teacher_id,
              title: "Students Waiting",
              body: `${beforeCount} students are waiting — please come online`,
              data: {
                type: "queue_threshold",
                screen: "/(teacher)/(tabs)/index",
                params: { programId: program_id },
              },
            },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Student notified",
        student_id: entry.student_id,
        expires_at: expiresAt,
        teacher_threshold_notified: beforeCount >= threshold,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
