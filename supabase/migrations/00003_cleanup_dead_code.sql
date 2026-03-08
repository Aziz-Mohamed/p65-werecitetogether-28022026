-- ============================================================
-- Migration: 00003_cleanup_dead_code
-- Purpose: Remove dead triggers and functions that reference
--          dropped tables/columns from earlier schema versions
-- ============================================================

-- Dead triggers (reference functions that use dropped columns/tables)
DROP TRIGGER IF EXISTS on_attendance_marked ON attendance;
DROP TRIGGER IF EXISTS on_session_created ON sessions;

-- Dead functions (reference dropped homework/points columns)
DROP FUNCTION IF EXISTS handle_attendance_points();
DROP FUNCTION IF EXISTS handle_homework_points();
DROP FUNCTION IF EXISTS handle_session_points();
