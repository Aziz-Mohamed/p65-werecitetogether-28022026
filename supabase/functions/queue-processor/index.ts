import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CLAIM_WINDOW_MINUTES = 3;

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the program_id from the request body (triggered when teacher becomes available)
    const { program_id } = await req.json();

    if (!program_id) {
      return new Response(
        JSON.stringify({ error: "program_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

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

    // Get student's push token
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("expo_token")
      .eq("profile_id", entry.student_id);

    if (tokens && tokens.length > 0) {
      // Send push notification via Expo Push API
      const messages = tokens.map((t: { expo_token: string }) => ({
        to: t.expo_token,
        title: "A teacher is available!",
        body: `Tap to join your session. You have ${CLAIM_WINDOW_MINUTES} minutes to claim your spot.`,
        data: {
          screen: "/(student)/queue-claim",
          params: { queueEntryId: entry.id, programId: program_id },
        },
        categoryId: "queue_available",
      }));

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });
    }

    return new Response(
      JSON.stringify({
        message: "Student notified",
        student_id: entry.student_id,
        expires_at: expiresAt,
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
