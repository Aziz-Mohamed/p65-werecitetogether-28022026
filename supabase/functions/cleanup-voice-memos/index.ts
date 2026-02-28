import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find expired voice memos
    const { data: expiredMemos, error: fetchError } = await supabase
      .from("session_voice_memos")
      .select("id, storage_path")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!expiredMemos || expiredMemos.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired voice memos", deleted: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Delete from Storage
    const storagePaths = expiredMemos.map((m: { storage_path: string }) => m.storage_path);
    const { error: storageError } = await supabase.storage
      .from("voice-memos")
      .remove(storagePaths);

    if (storageError) {
      console.error("Storage deletion error:", storageError.message);
    }

    // Delete DB rows
    const ids = expiredMemos.map((m: { id: string }) => m.id);
    const { error: deleteError } = await supabase
      .from("session_voice_memos")
      .delete()
      .in("id", ids);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        message: `Cleaned up ${expiredMemos.length} expired voice memos`,
        deleted: expiredMemos.length,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
