-- =============================================================================
-- Migration: Realign Programs & Tracks to Match Maqra'a Structure
-- Date: 2026-03-08
-- Description: Add parent_track_id for hierarchical tracks, fix program
--   categories, add missing tracks, deactivate obsolete tracks, and fix
--   Himam program name.
-- Reference: memory-bank/program-structure/maqraa-programs-structure.md
-- =============================================================================

-- =============================================================================
-- 1. Schema: Add parent_track_id to program_tracks
-- =============================================================================

ALTER TABLE program_tracks
  ADD COLUMN IF NOT EXISTS parent_track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL;

-- =============================================================================
-- 2. Fix program categories
-- =============================================================================

-- التسميع بالتناوب: mixed → free
UPDATE programs SET category = 'free'
WHERE sort_order = 1 AND category = 'mixed';

-- المتون: mixed → structured
UPDATE programs SET category = 'structured'
WHERE sort_order = 5 AND category = 'mixed';

-- =============================================================================
-- 3. Fix Himam program name to match RPC lookup
-- =============================================================================

UPDATE programs SET name = 'Himam Quranic Marathon'
WHERE sort_order = 8 AND name = 'Himam Marathon';

-- =============================================================================
-- 4. Track changes
-- =============================================================================

DO $$
DECLARE
  v_p1 UUID;  -- Alternating Recitation
  v_p3 UUID;  -- Non-Arabic Speakers
  v_p4 UUID;  -- Qiraat
  v_p5 UUID;  -- Mutoon
  v_p7 UUID;  -- Quran Memorization
  v_quran_parent UUID; -- قسم القرآن parent track
  v_muraja UUID;       -- مراجعة parent track
BEGIN
  SELECT id INTO v_p1 FROM programs WHERE sort_order = 1;
  SELECT id INTO v_p3 FROM programs WHERE sort_order = 3;
  SELECT id INTO v_p4 FROM programs WHERE sort_order = 4;
  SELECT id INTO v_p5 FROM programs WHERE sort_order = 5;
  SELECT id INTO v_p7 FROM programs WHERE sort_order = 7;

  -- ─── Program 1: التسميع بالتناوب — Restructure tracks ──────────────────

  -- Deactivate old tracks
  UPDATE program_tracks SET is_active = false
  WHERE program_id = v_p1 AND is_active = true;

  -- Clear track_type from old tracks (no longer mixed)
  UPDATE program_tracks SET track_type = NULL
  WHERE program_id = v_p1;

  -- Insert new tracks: قسم المتون (flat)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order)
  VALUES (v_p1, 'Mutoon Section', 'قسم المتون', 1);

  -- Insert new tracks: قسم القرآن (parent)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order)
  VALUES (v_p1, 'Quran Section', 'قسم القرآن', 2)
  RETURNING id INTO v_quran_parent;

  -- Insert child tracks under قسم القرآن
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order, parent_track_id)
  VALUES
    (v_p1, 'Certified Teachers', 'معلمون مجازون', 1, v_quran_parent),
    (v_p1, 'Students', 'طلاب', 2, v_quran_parent);

  -- ─── Program 3: الأعاجم — Add تصحيح track ──────────────────────────────

  INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order)
  VALUES (v_p3, 'Pronunciation Correction', 'تصحيح', 'free', 1)
  ON CONFLICT DO NOTHING;

  -- ─── Program 4: القراءات — Add الدوري عن أبي عمرو ───────────────────────

  INSERT INTO program_tracks (program_id, name, name_ar, sort_order)
  VALUES (v_p4, 'Al-Duri from Abu Amr', 'الدوري عن أبي عمرو', 4)
  ON CONFLICT DO NOTHING;

  -- ─── Program 5: المتون — Deactivate Free Section, clear track_type ──────

  -- Deactivate "Free Section" track
  UPDATE program_tracks SET is_active = false
  WHERE program_id = v_p5 AND name = 'Free Section';

  -- Clear track_type from remaining tracks (inherited from program category)
  UPDATE program_tracks SET track_type = NULL
  WHERE program_id = v_p5 AND is_active = true;

  -- ─── Program 7: القرآن الكريم — Restructure with hierarchy ─────────────

  -- Add تحفيظ (Memorization) flat track
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order)
  VALUES (v_p7, 'Memorization', 'تحفيظ', 1);

  -- Add مراجعة (Revision) parent track
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order)
  VALUES (v_p7, 'Revision', 'مراجعة', 2)
  RETURNING id INTO v_muraja;

  -- Move existing Mateen tracks under مراجعة
  UPDATE program_tracks
  SET parent_track_id = v_muraja, sort_order = 1
  WHERE program_id = v_p7 AND name_ar = 'متين ١٠ أجزاء';

  UPDATE program_tracks
  SET parent_track_id = v_muraja, sort_order = 2
  WHERE program_id = v_p7 AND name_ar = 'متين ١٥ جزء';

  UPDATE program_tracks
  SET parent_track_id = v_muraja, sort_order = 3
  WHERE program_id = v_p7 AND name_ar = 'متين ٣٠ جزء';

  -- Move Thabbitha under مراجعة
  UPDATE program_tracks
  SET parent_track_id = v_muraja, sort_order = 4
  WHERE program_id = v_p7 AND name_ar = 'ثبتها';

  -- Deactivate Itqan
  UPDATE program_tracks SET is_active = false
  WHERE program_id = v_p7 AND name_ar = 'الإتقان';

END $$;

-- =============================================================================
-- 5. Update category constraint (remove 'mixed')
-- =============================================================================

ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_category_check;
ALTER TABLE programs ADD CONSTRAINT programs_category_check
  CHECK (category IN ('free', 'structured'));

-- =============================================================================
-- 6. Index for parent_track_id lookups
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_program_tracks_parent
  ON program_tracks (parent_track_id)
  WHERE parent_track_id IS NOT NULL;
