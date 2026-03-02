import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

interface Registration {
  id: string;
  student_id: string;
  track: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { event_id } = await req.json();

    if (!event_id) {
      return new Response(
        JSON.stringify({ error: "event_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify event exists and is upcoming or active
    const { data: event, error: eventError } = await supabase
      .from("himam_events")
      .select("id, status")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (event.status !== "upcoming" && event.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Event is not eligible for matching" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get all unmatched registrations (status = 'registered', no partner)
    const { data: unmatched, error: unmatchedError } = await supabase
      .from("himam_registrations")
      .select("id, student_id, track")
      .eq("event_id", event_id)
      .eq("status", "registered")
      .is("partner_id", null)
      .order("created_at", { ascending: true });

    if (unmatchedError) {
      throw unmatchedError;
    }

    if (!unmatched || unmatched.length === 0) {
      return new Response(
        JSON.stringify({ paired: 0, unmatched: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Group by track for FIFO pairing
    const byTrack = new Map<string, Registration[]>();
    for (const reg of unmatched) {
      const group = byTrack.get(reg.track) ?? [];
      group.push(reg);
      byTrack.set(reg.track, group);
    }

    let totalPaired = 0;
    let totalUnmatched = 0;

    // Pair within each track (FIFO — first registered pairs with second, etc.)
    for (const [_track, registrations] of byTrack) {
      const pairs: Array<[Registration, Registration]> = [];

      for (let i = 0; i + 1 < registrations.length; i += 2) {
        pairs.push([registrations[i], registrations[i + 1]]);
      }

      // Odd registrant remains unmatched
      if (registrations.length % 2 !== 0) {
        totalUnmatched++;
      }

      // Apply pairings
      for (const [a, b] of pairs) {
        // Update A: set partner to B, status to paired
        const { error: errA } = await supabase
          .from("himam_registrations")
          .update({ partner_id: b.student_id, status: "paired" })
          .eq("id", a.id);

        if (errA) {
          console.error(`Failed to pair registration ${a.id}:`, errA);
          continue;
        }

        // Update B: set partner to A, status to paired
        const { error: errB } = await supabase
          .from("himam_registrations")
          .update({ partner_id: a.student_id, status: "paired" })
          .eq("id", b.id);

        if (errB) {
          console.error(`Failed to pair registration ${b.id}:`, errB);
          // Revert A if B fails
          await supabase
            .from("himam_registrations")
            .update({ partner_id: null, status: "registered" })
            .eq("id", a.id);
          continue;
        }

        totalPaired++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paired: totalPaired,
        unmatched: totalUnmatched,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("himam-partner-matching error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
