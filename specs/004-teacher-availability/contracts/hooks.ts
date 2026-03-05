/**
 * API Contract: Teacher Availability Hooks
 *
 * Query hooks wrap service methods with TanStack Query.
 * Mutation hooks use useMutation with cache invalidation.
 */

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * useAvailableTeachers(programId: string)
 * - queryKey: ['available-teachers', programId]
 * - queryFn: availabilityService.getAvailableTeachers(programId)
 * - enabled: !!programId
 * - Returns AvailableTeacher[]
 * - Invalidated by Realtime subscription on teacher_availability changes
 */

/**
 * useMyAvailability()
 * - queryKey: ['my-availability']
 * - queryFn: availabilityService.getMyAvailability()
 * - Returns TeacherAvailability[] (with joined program names)
 * - Used on teacher dashboard for toggle state
 */

/**
 * useTeacherProfile()
 * - queryKey: ['teacher-profile']
 * - queryFn: availabilityService.getTeacherProfile()
 * - Returns TeacherProfileExtensions
 * - Used on profile settings screen
 */

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * useToggleAvailability()
 * - mutationFn: availabilityService.toggleAvailability(input)
 * - onSuccess: invalidate ['my-availability'], ['available-teachers']
 */

/**
 * useJoinSession()
 * - mutationFn: availabilityService.joinSession(availabilityId)
 * - onSuccess: invalidate ['available-teachers', programId]
 * - Returns boolean (true = success, false = teacher full)
 */

// useLeaveSession() — REMOVED. No leave RPC needed; counter resets on offline/timeout.

/**
 * useUpdateTeacherProfile()
 * - mutationFn: availabilityService.updateTeacherProfile(input)
 * - onSuccess: invalidate ['teacher-profile']
 */

// ─── Realtime Integration ────────────────────────────────────────────────────

/**
 * Extend event-query-map.ts with:
 *
 * case 'teacher_availability':
 *   return [['available-teachers'], ['my-availability']];
 *
 * Extend role subscription profiles to include teacher_availability table
 * for student and teacher roles.
 */
