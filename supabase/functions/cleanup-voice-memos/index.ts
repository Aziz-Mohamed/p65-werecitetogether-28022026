import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find expired voice memos that haven't been marked yet
  const { data: expiredMemos, error: fetchError } = await supabase
    .from('session_voice_memos')
    .select('id, storage_path')
    .lte('expires_at', new Date().toISOString())
    .eq('is_expired', false);

  if (fetchError) {
    console.error('Failed to fetch expired memos:', fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!expiredMemos || expiredMemos.length === 0) {
    return new Response(JSON.stringify({ deleted: 0 }), { status: 200 });
  }

  // Delete storage files
  const storagePaths = expiredMemos.map((m) => m.storage_path);
  const { error: removeError } = await supabase.storage
    .from('voice-memos')
    .remove(storagePaths);

  if (removeError) {
    console.error('Failed to remove storage files:', removeError.message);
  }

  // Mark as expired
  const ids = expiredMemos.map((m) => m.id);
  const { error: updateError } = await supabase
    .from('session_voice_memos')
    .update({ is_expired: true })
    .in('id', ids);

  if (updateError) {
    console.error('Failed to mark memos as expired:', updateError.message);
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  console.log(`Cleaned up ${ids.length} expired voice memos`);
  return new Response(JSON.stringify({ deleted: ids.length }), { status: 200 });
});
