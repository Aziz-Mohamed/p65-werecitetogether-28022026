import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();

    let activated = 0;
    let completed = 0;
    let remindersSent = 0;

    // ─── Step 1: Activate upcoming events whose start time has arrived ──
    // Events where event_date + start_time <= now
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from("himam_events")
      .select("id, event_date, start_time, timezone")
      .eq("status", "upcoming");

    if (upcomingError) {
      console.error("Error fetching upcoming events:", upcomingError);
    }

    for (const event of upcomingEvents ?? []) {
      const eventStart = new Date(`${event.event_date}T${event.start_time}`);

      if (eventStart <= now) {
        // Activate the event
        const { error: activateError } = await supabase
          .from("himam_events")
          .update({ status: "active" })
          .eq("id", event.id);

        if (activateError) {
          console.error(`Failed to activate event ${event.id}:`, activateError);
          continue;
        }

        // Transition paired registrations to in_progress
        const { error: regError } = await supabase
          .from("himam_registrations")
          .update({ status: "in_progress" })
          .eq("event_id", event.id)
          .eq("status", "paired");

        if (regError) {
          console.error(`Failed to update registrations for event ${event.id}:`, regError);
        }

        activated++;
      }
    }

    // ─── Step 2: Complete active events whose end time + 24h has passed ─
    const { data: activeEvents, error: activeError } = await supabase
      .from("himam_events")
      .select("id, event_date, end_time")
      .eq("status", "active");

    if (activeError) {
      console.error("Error fetching active events:", activeError);
    }

    for (const event of activeEvents ?? []) {
      const eventEnd = new Date(`${event.event_date}T${event.end_time}`);
      const completionDeadline = new Date(eventEnd.getTime() + 24 * 60 * 60 * 1000);

      if (completionDeadline <= now) {
        // Complete the event
        const { error: completeError } = await supabase
          .from("himam_events")
          .update({ status: "completed" })
          .eq("id", event.id);

        if (completeError) {
          console.error(`Failed to complete event ${event.id}:`, completeError);
          continue;
        }

        // Mark non-completed registrations as incomplete
        const { error: incompleteError } = await supabase
          .from("himam_registrations")
          .update({ status: "incomplete" })
          .eq("event_id", event.id)
          .in("status", ["registered", "paired", "in_progress"]);

        if (incompleteError) {
          console.error(`Failed to mark incomplete for event ${event.id}:`, incompleteError);
        }

        completed++;
      }
    }

    // ─── Step 3: Send reminders for events starting within 24 hours ─────
    // Re-query upcoming events (some may have just been activated above)
    const { data: reminderEvents, error: reminderError } = await supabase
      .from("himam_events")
      .select("id, event_date, start_time")
      .eq("status", "upcoming");

    if (reminderError) {
      console.error("Error fetching reminder events:", reminderError);
    }

    for (const event of reminderEvents ?? []) {
      const eventStart = new Date(`${event.event_date}T${event.start_time}`);
      const reminderWindow = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);

      // Within 24h window and event hasn't started yet
      if (reminderWindow <= now && eventStart > now) {
        // Get registrations for this event that haven't been reminded
        const { data: registrations, error: regError } = await supabase
          .from("himam_registrations")
          .select("id, student_id")
          .eq("event_id", event.id)
          .in("status", ["registered", "paired"]);

        if (regError) {
          console.error(`Failed to fetch registrations for reminders:`, regError);
          continue;
        }

        // Send reminder notifications via send-notification edge function
        for (const reg of registrations ?? []) {
          try {
            await supabase.functions.invoke("send-notification", {
              body: {
                user_id: reg.student_id,
                title: "Himam Event Reminder",
                body: "Your Himam event starts tomorrow!",
                data: { event_id: event.id, type: "himam_reminder" },
              },
            });
            remindersSent++;
          } catch (notifError) {
            console.error(`Failed to send reminder to ${reg.student_id}:`, notifError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        activated,
        completed,
        reminders_sent: remindersSent,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("himam-event-lifecycle error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
