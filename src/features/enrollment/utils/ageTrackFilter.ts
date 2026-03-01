/**
 * Age-based track eligibility rules for Children's Program (FR-027, FR-028).
 *
 * Track name → age range (min_age inclusive, max_age inclusive).
 * If a track is not listed here, no age restriction applies.
 */
const AGE_RESTRICTIONS: Record<string, { min: number; max: number }> = {
  talqeen: { min: 3, max: 6 },
  nooraniyah: { min: 4, max: 8 },
  memorization: { min: 6, max: 99 },
};

/**
 * Determine the approximate age from profile age_range string.
 * The app stores age_range as e.g. "3-6", "7-12", "13-17", "18-25", "26-35", etc.
 * Returns the midpoint as a rough age estimate, or the lower bound for filtering.
 */
export function parseAgeFromRange(ageRange: string | null | undefined): number | null {
  if (!ageRange) return null;
  const match = ageRange.match(/^(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Filter tracks that a student is eligible for based on their age.
 * Returns only tracks the student meets the age requirement for.
 */
export function filterTracksByAge<T extends { name: string }>(
  tracks: T[],
  ageRange: string | null | undefined,
): T[] {
  const age = parseAgeFromRange(ageRange);
  if (age === null) return tracks; // No age info — show all

  return tracks.filter((track) => {
    const normalizedName = track.name.toLowerCase().replace(/[\s-_]/g, '');
    const restriction = Object.entries(AGE_RESTRICTIONS).find(
      ([key]) => normalizedName.includes(key),
    );

    if (!restriction) return true; // No restriction for this track
    const [, { min, max }] = restriction;
    return age >= min && age <= max;
  });
}

/**
 * Check if a student is eligible for a specific track based on age.
 */
export function isEligibleForTrack(
  trackName: string,
  ageRange: string | null | undefined,
): boolean {
  const age = parseAgeFromRange(ageRange);
  if (age === null) return true;

  const normalizedName = trackName.toLowerCase().replace(/[\s-_]/g, '');
  const restriction = Object.entries(AGE_RESTRICTIONS).find(
    ([key]) => normalizedName.includes(key),
  );

  if (!restriction) return true;
  const [, { min, max }] = restriction;
  return age >= min && age <= max;
}
