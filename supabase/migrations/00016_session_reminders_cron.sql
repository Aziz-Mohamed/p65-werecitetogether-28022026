-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 00016_session_reminders_cron.sql
-- Feature: pg_cron job to invoke session-reminders edge function every 15 min
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run every 15 minutes to catch sessions starting in the next 30-min window
SELECT cron.schedule(
  'session-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/session-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
