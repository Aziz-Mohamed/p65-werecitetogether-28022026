import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface PairingPayload {
  event_id: string;
}

interface Registration {
  id: string;
  student_id: string;
  track: string;
  time_slots: string[];
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function countOverlap(a: string[], b: string[]): number {
  return a.filter((slot) => b.includes(slot)).length;
}

async function sendPartnerNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  studentId: string,
  partnerName: string,
) {
  await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      type: "himam_partner_assigned",
      student_id: studentId,
      partner_name: partnerName,
    }),
  });
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as PairingPayload;
    const { event_id } = payload;

    if (!event_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing event_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseAdmin();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch all registered students for this event
    const { data: registrations, error: fetchError } = await supabase
      .from("himam_registrations")
      .select("id, student_id, track, time_slots")
      .eq("event_id", event_id)
      .eq("status", "registered")
      .order("created_at");

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, pairs_created: 0, unpaired_students: [], notifications_sent: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Group by track
    const byTrack = new Map<string, Registration[]>();
    for (const reg of registrations) {
      const list = byTrack.get(reg.track) ?? [];
      list.push(reg as Registration);
      byTrack.set(reg.track, list);
    }

    let pairsCreated = 0;
    const unpairedStudents: string[] = [];
    let notificationsSent = 0;

    // Fetch all profile names in one query for notifications
    const studentIds = registrations.map((r) => r.student_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);
    const nameMap = new Map<string, string>();
    if (profiles) {
      for (const p of profiles) {
        nameMap.set(p.id, p.full_name);
      }
    }

    for (const [, regs] of byTrack) {
      // Sort by time slot count descending for greedy matching
      regs.sort((a, b) => (b.time_slots?.length ?? 0) - (a.time_slots?.length ?? 0));

      // Pair adjacent
      for (let i = 0; i + 1 < regs.length; i += 2) {
        const regA = regs[i];
        const regB = regs[i + 1];

        // Update both registrations
        await supabase
          .from("himam_registrations")
          .update({ partner_id: regB.student_id, status: "paired" })
          .eq("id", regA.id);

        await supabase
          .from("himam_registrations")
          .update({ partner_id: regA.student_id, status: "paired" })
          .eq("id", regB.id);

        pairsCreated++;

        // Send notifications
        const nameA = nameMap.get(regA.student_id) ?? "";
        const nameB = nameMap.get(regB.student_id) ?? "";

        await sendPartnerNotification(supabaseUrl, serviceRoleKey, regA.student_id, nameB);
        await sendPartnerNotification(supabaseUrl, serviceRoleKey, regB.student_id, nameA);
        notificationsSent += 2;
      }

      // Odd student
      if (regs.length % 2 === 1) {
        unpairedStudents.push(regs[regs.length - 1].student_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pairs_created: pairsCreated,
        unpaired_students: unpairedStudents,
        notifications_sent: notificationsSent,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[generate-himam-pairings] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
