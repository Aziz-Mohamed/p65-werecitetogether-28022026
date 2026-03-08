-- Add program_name_ar to search_users_for_role_assignment RPC
-- so that the master admin user search returns Arabic program names.

CREATE OR REPLACE FUNCTION search_users_for_role_assignment(
  p_search_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  role text,
  avatar_url text,
  created_at timestamptz,
  program_roles_data json
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    au.email::text,
    p.role,
    p.avatar_url,
    p.created_at,
    (
      SELECT COALESCE(json_agg(json_build_object(
        'role_id', pr.id,
        'program_id', pr.program_id,
        'program_name', prog.name,
        'program_name_ar', prog.name_ar,
        'role', pr.role
      )), '[]'::json)
      FROM program_roles pr
      JOIN programs prog ON prog.id = pr.program_id
      WHERE pr.profile_id = p.id
    ) AS program_roles_data
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.full_name ILIKE '%' || p_search_query || '%'
     OR au.email ILIKE '%' || p_search_query || '%'
  ORDER BY p.full_name
  LIMIT p_limit;
END;
$$;
