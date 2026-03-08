-- ─── Enriched program list for master admin dashboard ─────────────────────────
-- Returns all programs with aggregated stats (enrolled, team, cohorts, tracks, sessions).

CREATE OR REPLACE FUNCTION get_master_admin_programs_enriched()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.sort_order), '[]'::json)
  INTO v_result
  FROM (
    SELECT
      p.id,
      p.name,
      p.name_ar,
      p.description,
      p.description_ar,
      p.category,
      p.is_active,
      p.settings,
      p.sort_order,
      p.created_at,
      p.updated_at,
      (SELECT count(*)::int FROM enrollments e
       WHERE e.program_id = p.id AND e.status IN ('active', 'approved')) AS enrolled_count,
      (SELECT count(*)::int FROM program_roles pr
       WHERE pr.program_id = p.id) AS team_count,
      (SELECT count(*)::int FROM cohorts c
       WHERE c.program_id = p.id AND c.status IN ('enrollment_open', 'in_progress')) AS active_cohort_count,
      (SELECT count(*)::int FROM program_tracks pt
       WHERE pt.program_id = p.id AND pt.is_active = true) AS track_count,
      (SELECT count(*)::int FROM sessions s
       WHERE s.program_id = p.id AND s.created_at >= (now() - interval '7 days')) AS session_count_7d
    FROM programs p
    ORDER BY p.sort_order
  ) sub;

  RETURN v_result;
END;
$$;
