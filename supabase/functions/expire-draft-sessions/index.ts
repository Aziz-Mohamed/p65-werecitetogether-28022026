import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the expire_draft_sessions() database function created in migration
    const { error } = await supabase.rpc("expire_draft_sessions");

    if (error) {
      console.error("[expire-draft-sessions] Database function error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Count how many sessions were expired (check recently updated ones)
    const { count } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired")
      .gte("updated_at", new Date(Date.now() - 60_000).toISOString());

    const expiredCount = count ?? 0;

    console.log(
      `[expire-draft-sessions] Expired ${expiredCount} draft sessions`,
    );

    return new Response(
      JSON.stringify({ expired_count: expiredCount }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[expire-draft-sessions] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
