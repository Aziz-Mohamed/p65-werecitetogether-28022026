import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getNextSaturday(): string {
  const now = new Date();
  // Shift to Makkah time (UTC+3)
  const makkah = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const day = makkah.getUTCDay(); // 0=Sun, 6=Sat
  const daysUntilSat = (6 - day + 7) % 7 || 7; // always next Saturday
  const nextSat = new Date(makkah);
  nextSat.setUTCDate(nextSat.getUTCDate() + daysUntilSat);
  // Format as YYYY-MM-DD
  return nextSat.toISOString().split("T")[0];
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = getSupabaseAdmin();

    // Find Himam program
    const { data: program } = await supabase
      .from("programs")
      .select("id")
      .or("name.eq.Himam Quranic Marathon,name_ar.eq.برنامج همم القرآني")
      .limit(1)
      .single();

    if (!program) {
      return new Response(
        JSON.stringify({ created: false, error: "Himam program not found" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const eventDate = getNextSaturday();

    // Check if event already exists
    const { data: existing } = await supabase
      .from("himam_events")
      .select("id")
      .eq("event_date", eventDate)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ created: false, event_id: existing.id, event_date: eventDate }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Calculate deadline: Friday 21:00 UTC = Saturday 00:00 Makkah
    const deadlineDate = new Date(eventDate + "T00:00:00Z");
    deadlineDate.setUTCDate(deadlineDate.getUTCDate() - 1); // Friday
    deadlineDate.setUTCHours(21, 0, 0, 0);
    const registrationDeadline = deadlineDate.toISOString();

    // Insert event
    const { data: newEvent, error } = await supabase
      .from("himam_events")
      .insert({
        program_id: program.id,
        event_date: eventDate,
        start_time: "05:00",
        end_time: "05:00",
        registration_deadline: registrationDeadline,
        status: "upcoming",
      })
      .select("id")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ created: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ created: true, event_id: newEvent.id, event_date: eventDate }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[generate-himam-events] Error:", error);
    return new Response(
      JSON.stringify({ created: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
