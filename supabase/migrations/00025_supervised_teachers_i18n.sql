-- Add name_localized and program_name_ar to get_supervised_teachers RPC
-- for proper i18n support in supervisor UI screens.

CREATE OR REPLACE FUNCTION get_supervised_teachers(p_supervisor_id uuid)
RETURNS TABLE(
  teacher_id uuid,
  full_name text,
  name_localized jsonb,
  avatar_url text,
  program_id uuid,
  program_name text,
  program_name_ar text,
  student_count bigint,
  sessions_this_week bigint,
  average_rating numeric,
  is_active boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('supervisor', 'master_admin') THEN
    RAISE EXCEPTION 'Supervisor or master_admin role required';
  END IF;

  RETURN QUERY
  SELECT
    pr.profile_id AS teacher_id,
    p.full_name,
    p.name_localized,
    p.avatar_url,
    pr.program_id,
    prog.name AS program_name,
    prog.name_ar AS program_name_ar,
    (
      SELECT count(DISTINCT e.student_id)
      FROM enrollments e
      WHERE e.teacher_id = pr.profile_id
        AND e.program_id = pr.program_id
        AND e.status IN ('active', 'approved')
    ) AS student_count,
    (
      SELECT count(*)
      FROM sessions s
      WHERE s.teacher_id = pr.profile_id
        AND s.created_at >= (now() - interval '7 days')
    ) AS sessions_this_week,
    (
      SELECT trs.average_rating
      FROM teacher_rating_stats trs
      WHERE trs.teacher_id = pr.profile_id
    ) AS average_rating,
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.teacher_id = pr.profile_id
        AND s.created_at >= (now() - interval '7 days')
    ) AS is_active
  FROM program_roles pr
  JOIN profiles p ON p.id = pr.profile_id
  JOIN programs prog ON prog.id = pr.program_id
  WHERE pr.supervisor_id = p_supervisor_id
    AND pr.role = 'teacher';
END;
$$;
