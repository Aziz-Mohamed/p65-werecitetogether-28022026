-- Allow master_admin to change any user's global role.
-- Replaces the need for separate promote/demote RPCs for non-master-admin roles.

CREATE OR REPLACE FUNCTION change_user_role(
  p_user_id uuid,
  p_new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_role text;
  v_master_admin_count int;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  -- Validate role
  IF p_new_role NOT IN ('student', 'teacher', 'supervisor', 'program_admin', 'master_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  -- Get current role
  SELECT role INTO v_current_role FROM profiles WHERE id = p_user_id;
  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Prevent removing the last master_admin
  IF v_current_role = 'master_admin' AND p_new_role != 'master_admin' THEN
    SELECT count(*) INTO v_master_admin_count FROM profiles WHERE role = 'master_admin';
    IF v_master_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last master admin';
    END IF;
  END IF;

  -- Prevent self-demotion from master_admin
  IF p_user_id = auth.uid() AND v_current_role = 'master_admin' AND p_new_role != 'master_admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself from master admin';
  END IF;

  UPDATE profiles SET role = p_new_role WHERE id = p_user_id;
END;
$$;
