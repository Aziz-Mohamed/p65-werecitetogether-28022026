import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Invoked by pg_net trigger when a teacher goes available.
// Finds the first waiting student in that program's queue, sets them as notified
// with a 3-minute claim window, and sends a push notification via send-notification.

interface QueueProcessorPayload {
  teacher_id: string;
  program_id: string;
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as QueueProcessorPayload;
    const { teacher_id, program_id } = payload;

    if (!teacher_id || !program_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing teacher_id or program_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseAdmin();

    // Find first waiting student in queue (ordered by priority: daily_sessions ASC, joined_at ASC)
    const { data: nextEntry, error: fetchError } = await supabase
      .from("program_queue_entries")
      .select("id, student_id, program_id")
      .eq("program_id", program_id)
      .eq("status", "waiting")
      .order("daily_sessions_at_join", { ascending: true })
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("[queue-processor] Error fetching queue:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!nextEntry) {
      return new Response(
        JSON.stringify({ success: true, message: "No waiting students" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Set student as notified with 3-min claim window
    const claimDeadline = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from("program_queue_entries")
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
        claim_expires_at: claimDeadline,
        teacher_id,
      })
      .eq("id", nextEntry.id);

    if (updateError) {
      console.error("[queue-processor] Error updating entry:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Send push notification via send-notification Edge Function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        type: "queue_available",
        student_id: nextEntry.student_id,
        program_id: nextEntry.program_id,
        entry_id: nextEntry.id,
        teacher_id,
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        notified_student: nextEntry.student_id,
        entry_id: nextEntry.id,
        claim_expires_at: claimDeadline,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[queue-processor] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
