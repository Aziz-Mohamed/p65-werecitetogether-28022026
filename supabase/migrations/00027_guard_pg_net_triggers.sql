-- =============================================================================
-- Guard pg_net triggers against missing app.settings
-- =============================================================================
-- When app.settings.supabase_url is not configured (e.g. local dev without
-- edge functions), pg_net.http_post fails with a NULL url, which rolls back
-- the entire transaction. This migration:
-- Rewrites affected trigger functions to skip HTTP when settings are missing.
-- =============================================================================

-- ─── trigger_on_teacher_available (from 00008) ──────────────────────────────
-- Fires AFTER UPDATE on teacher_availability. Invokes queue-processor edge fn.
CREATE OR REPLACE FUNCTION trigger_on_teacher_available()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url TEXT;
BEGIN
  IF NEW.is_available = true AND (OLD IS NULL OR OLD.is_available = false) THEN
    _url := current_setting('app.settings.supabase_url', true);
    -- Skip notification if settings are not configured (local dev)
    IF _url IS NOT NULL AND _url <> '' THEN
      PERFORM net.http_post(
        url := _url || '/functions/v1/queue-processor',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'teacher_id', NEW.teacher_id,
          'program_id', NEW.program_id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
