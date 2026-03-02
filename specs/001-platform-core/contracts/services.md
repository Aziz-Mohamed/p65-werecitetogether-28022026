# Service Contracts: WeReciteTogether Core Platform

**Date**: 2026-02-28
**Pattern**: Each service wraps Supabase SDK calls. No ORM. Services return `{ data, error }` — never throw.

## auth.service.ts

```typescript
signInWithGoogle(idToken: string): Promise<AuthResult>
signInWithApple(identityToken: string): Promise<AuthResult>
signOut(): Promise<void>
getCurrentSession(): Promise<Session | null>
onAuthStateChange(callback: (event, session) => void): Subscription
```

## onboarding.service.ts

```typescript
completeOnboarding(data: OnboardingData): Promise<ServiceResult<Profile>>
// OnboardingData: { fullName, gender, ageRange, country, region? }
```

## programs.service.ts

```typescript
getPrograms(): Promise<ServiceResult<Program[]>>
getProgramById(id: string): Promise<ServiceResult<ProgramWithTracks>>
getProgramTracks(programId: string): Promise<ServiceResult<ProgramTrack[]>>
createProgram(data: CreateProgramInput): Promise<ServiceResult<Program>>
updateProgram(id: string, data: UpdateProgramInput): Promise<ServiceResult<Program>>
createTrack(programId: string, data: CreateTrackInput): Promise<ServiceResult<ProgramTrack>>
updateTrack(id: string, data: UpdateTrackInput): Promise<ServiceResult<ProgramTrack>>
```

## program-roles.service.ts

```typescript
assignRole(data: { profileId, programId, role }): Promise<ServiceResult<ProgramRole>>
removeRole(id: string): Promise<ServiceResult<void>>
getRolesForProgram(programId: string): Promise<ServiceResult<ProgramRoleWithProfile[]>>
getUserPrograms(profileId: string): Promise<ServiceResult<ProgramRole[]>>
```

## teacher-availability.service.ts

```typescript
toggleAvailability(teacherId: string, programId: string, isAvailable: boolean): Promise<ServiceResult<TeacherAvailability>>
getAvailableTeachers(programId: string): Promise<ServiceResult<AvailableTeacher[]>>
updateMaxConcurrent(teacherId: string, programId: string, max: number): Promise<ServiceResult<void>>
// AvailableTeacher: TeacherAvailability + profile fields + rating stats
```

## sessions.service.ts

```typescript
createDraftSession(data: { teacherId, studentId, programId, meetingLink }): Promise<ServiceResult<Session>>
completeSession(sessionId: string, data: CompleteSessionInput): Promise<ServiceResult<Session>>
cancelSession(sessionId: string): Promise<ServiceResult<void>>
getSessionById(id: string): Promise<ServiceResult<SessionWithDetails>>
getSessionsByStudent(studentId: string, options?: PaginationOptions): Promise<ServiceResult<Session[]>>
getSessionsByTeacher(teacherId: string, options?: PaginationOptions): Promise<ServiceResult<Session[]>>
logAttendance(sessionId: string, entries: AttendanceEntry[]): Promise<ServiceResult<void>>
// AttendanceEntry: { studentId, score, notes }
```

## voice-memos.service.ts

```typescript
uploadVoiceMemo(data: { sessionId, teacherId, studentId, programId, filePath, durationSeconds }): Promise<ServiceResult<VoiceMemo>>
getVoiceMemoForSession(sessionId: string, studentId: string): Promise<ServiceResult<VoiceMemo | null>>
getVoiceMemoUrl(storagePath: string): Promise<ServiceResult<string>>
// Note: cleanup is handled by Edge Function cron, not client-side
```

## enrollment.service.ts

```typescript
enroll(data: { studentId, programId, trackId?, cohortId? }): Promise<ServiceResult<Enrollment>>
approveEnrollment(enrollmentId: string): Promise<ServiceResult<Enrollment>>
dropEnrollment(enrollmentId: string): Promise<ServiceResult<void>>
getEnrollmentsByStudent(studentId: string): Promise<ServiceResult<EnrollmentWithDetails[]>>
getEnrollmentsByCohort(cohortId: string): Promise<ServiceResult<EnrollmentWithProfile[]>>
getEnrollmentsByProgram(programId: string): Promise<ServiceResult<Enrollment[]>>
```

## cohorts.service.ts

```typescript
createCohort(data: CreateCohortInput): Promise<ServiceResult<Cohort>>
updateCohort(id: string, data: UpdateCohortInput): Promise<ServiceResult<Cohort>>
updateCohortStatus(id: string, status: CohortStatus): Promise<ServiceResult<Cohort>>
getCohortsByProgram(programId: string): Promise<ServiceResult<Cohort[]>>
getCohortById(id: string): Promise<ServiceResult<CohortWithDetails>>
```

## teacher-ratings.service.ts

```typescript
submitReview(data: { teacherId, studentId, sessionId, programId, rating, tags?, comment? }): Promise<ServiceResult<TeacherReview>>
getReviewsForTeacher(teacherId: string, programId: string): Promise<ServiceResult<TeacherReview[]>>
getRatingStats(teacherId: string, programId: string): Promise<ServiceResult<TeacherRatingStats>>
excludeReview(reviewId: string, excludedBy: string, reason: string): Promise<ServiceResult<void>>
canStudentReview(studentId: string, sessionId: string): Promise<ServiceResult<boolean>>
// Checks: not already reviewed + within 48hr window
```

## queue.service.ts

```typescript
joinQueue(studentId: string, programId: string): Promise<ServiceResult<QueueEntry>>
leaveQueue(studentId: string, programId: string): Promise<ServiceResult<void>>
getQueuePosition(studentId: string, programId: string): Promise<ServiceResult<number | null>>
getQueueSize(programId: string): Promise<ServiceResult<number>>
claimQueueSlot(queueEntryId: string): Promise<ServiceResult<void>>
getDailySessionCount(studentId: string, programId: string): Promise<ServiceResult<number>>
```

## waitlist.service.ts

```typescript
joinWaitlist(data: { studentId, programId, trackId?, cohortId?, teacherId? }): Promise<ServiceResult<WaitlistEntry>>
leaveWaitlist(entryId: string): Promise<ServiceResult<void>>
confirmWaitlistOffer(entryId: string): Promise<ServiceResult<Enrollment>>
getWaitlistPosition(studentId: string, programId: string): Promise<ServiceResult<number | null>>
getWaitlistByProgram(programId: string): Promise<ServiceResult<WaitlistEntry[]>>
```

## notifications.service.ts

```typescript
registerPushToken(profileId: string, token: string, platform: 'ios' | 'android'): Promise<ServiceResult<void>>
getPreferences(profileId: string): Promise<ServiceResult<NotificationPreference[]>>
updatePreference(profileId: string, category: string, enabled: boolean): Promise<ServiceResult<void>>
// Push sending handled by Edge Functions, not client
```

## profile.service.ts

```typescript
getProfile(id: string): Promise<ServiceResult<Profile>>
updateProfile(id: string, data: UpdateProfileInput): Promise<ServiceResult<Profile>>
searchProfiles(query: string, role?: UserRole): Promise<ServiceResult<Profile[]>>
```

## supervisor.service.ts

```typescript
getAssignedTeachers(supervisorId: string, programId: string): Promise<ServiceResult<TeacherSummary[]>>
getTeacherDetail(teacherId: string, programId: string): Promise<ServiceResult<TeacherDetail>>
reassignStudent(enrollmentId: string, newTeacherId: string): Promise<ServiceResult<void>>
getFlaggedReviews(programId: string): Promise<ServiceResult<TeacherReview[]>>
// TeacherSummary: { profile, sessionCount, activeStudents, averageRating }
```

## Type Conventions

```typescript
type ServiceResult<T> = { data: T; error: null } | { data: null; error: string }
type PaginationOptions = { page?: number; pageSize?: number }
type UserRole = 'student' | 'teacher' | 'supervisor' | 'program_admin' | 'master_admin'
type CohortStatus = 'enrollment_open' | 'enrollment_closed' | 'in_progress' | 'completed' | 'archived'
type SessionStatus = 'draft' | 'completed' | 'cancelled'
type EnrollmentStatus = 'pending' | 'approved' | 'active' | 'completed' | 'dropped' | 'waitlisted'
```
