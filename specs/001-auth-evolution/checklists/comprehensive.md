# Comprehensive Checklist: Auth Evolution (OAuth)

**Purpose**: Validate requirements quality across all dimensions — completeness, clarity, consistency, coverage, and measurability
**Created**: 2026-03-03
**Resolved**: 2026-03-03
**Feature**: [spec.md](../spec.md)
**Depth**: Standard (~28 items)
**Audience**: Author self-review before task generation
**Status**: 28/28 RESOLVED

## Requirement Completeness

- [x] CHK001 - Are requirements defined for the login screen layout distinguishing between "Sign Up" (new user) and "Sign In" (returning user), or is it a single unified OAuth flow? [Gap, Spec §US1/FR-006]
  > **Resolved**: FR-006 now specifies a single unified flow with "Continue with Google" / "Continue with Apple" buttons. Supabase handles sign-up vs sign-in transparently. US1 updated with unified button language.

- [x] CHK002 - Are requirements specified for what the role-specific placeholder screens contain (branding, message text, sign-out button, contact admin link)? [Gap, Spec §Clarifications]
  > **Resolved**: FR-024 added — placeholder screens must show app logo, localized role title, "Coming soon" message in user's preferred language, and a sign-out button.

- [x] CHK003 - Are requirements defined for handling OAuth avatar URLs (Google provides `picture`, Apple may not) — should they be stored on the profile? [Gap, Spec §Key Entities]
  > **Resolved**: FR-025 added — avatar URL from Google's `picture` field is stored in `profiles.avatar_url`. Apple may not provide one; field remains NULL.

- [x] CHK004 - Are requirements specified for the seeded master_admin account's configuration (how credentials are managed, whether it uses OAuth or a special bootstrap mechanism)? [Gap, Spec §FR-021]
  > **Resolved**: FR-021 clarified — dev: seed.sql creates test users with password auth. Production: master_admin created via direct DB insert by deployment operator. Documented as bootstrap exception to OAuth-only rule.

- [x] CHK005 - Are loading/in-progress state requirements defined for the OAuth flow (between tapping the button and receiving the provider response)? [Gap, Spec §US1]
  > **Resolved**: FR-023 added — loading indicator must display on the OAuth button from tap until provider response. Button must be disabled during the flow to prevent double-taps.

- [x] CHK006 - Are requirements specified for deep linking / URL scheme configuration needed to handle OAuth callbacks on mobile? [Gap, Spec §Dependencies]
  > **Resolved**: Dependencies section clarified — native OAuth libraries (`@react-native-google-signin/google-signin`, `expo-apple-authentication`) handle callbacks internally. No deep linking or URL scheme configuration needed.

- [x] CHK007 - Are requirements defined for localized display names of the 7 roles in the role selector and dev pills (English and Arabic labels)? [Gap, Spec §FR-011]
  > **Resolved**: FR-011 updated with full localization table — all 7 roles with English and Arabic display names (e.g., student/طالب, teacher/معلم, master_admin/المدير العام).

## Requirement Clarity

- [x] CHK008 - Is it clear whether unavailable roles in the role editor should be hidden entirely or shown as disabled for regular admins? US3 Scenario 1 says "all seven roles are listed" but FR-009 limits regular admins to 3 assignable roles. [Ambiguity, Spec §US3-S1 vs FR-009]
  > **Resolved**: FR-009 clarified — regular admins see ONLY the 3 roles they can assign (student, teacher, parent). Non-assignable roles are hidden, not disabled. US3 Scenario 1 updated to match.

- [x] CHK009 - Is the scope of "remove" in FR-022 precisely defined — does it mean removing UI only, or also edge functions, database triggers, and synthetic email references throughout the codebase? [Clarity, Spec §FR-022]
  > **Resolved**: FR-022 scope clarified — full removal including login UI, `buildSyntheticEmail` helper, `createSchool`/`resetMemberPassword` service functions, `create-school` and `reset-member-password` edge functions, school slug input, and all synthetic email references in the codebase.

- [x] CHK010 - Is "user-friendly, localized error message" in FR-012 specific enough — are error message categories defined (network error vs provider error vs cancelled vs unknown)? [Clarity, Spec §FR-012]
  > **Resolved**: FR-012 updated with 4 error categories: network error ("Check your internet connection"), user cancelled (silent dismiss), provider error ("Sign-in temporarily unavailable"), unknown ("Something went wrong. Please try again").

- [x] CHK011 - Is the auto-linking behavior in FR-013 defined clearly for edge cases — what happens if the matching email belongs to an admin-created legacy account? [Clarity, Spec §FR-013]
  > **Resolved**: FR-013 clarified — auto-linking applies to OAuth-to-OAuth only (same email, different providers). Legacy admin-created accounts with synthetic emails will not match OAuth emails because synthetic emails use `@school-slug.quranschool.app` domain.

- [x] CHK012 - Is US1's phrase "Sign Up with Google" clear about whether this is a separate screen/button from returning-user sign-in, or a single OAuth button that handles both? [Ambiguity, Spec §US1]
  > **Resolved**: US1 updated to use "Continue with Google" / "Continue with Apple" language throughout. Single button per provider handles both sign-up and sign-in. Supabase determines which path transparently.

## Requirement Consistency

- [x] CHK013 - Does FR-022 (fully remove synthetic email system) conflict with Constitution VII which states "Existing password-based authentication is PRESERVED during the transition period"? Is there a documented reconciliation? [Conflict, Spec §FR-022 vs Constitution §VII]
  > **Resolved**: Clarifications section documents this as an intentional deviation from Constitution VII. User explicitly chose OAuth-only. Constitution amendment planned to update Principle VII after this spec is implemented.

- [x] CHK014 - Are US3 Scenario 1 ("all seven roles are listed") and FR-009 ("regular admins can only assign student, teacher, parent") reconciled — does "listed" mean "visible but some disabled" or is one requirement wrong? [Conflict, Spec §US3-S1 vs FR-009]
  > **Resolved**: US3 Scenario 1 rewritten — regular admin sees only the 3 assignable roles (student, teacher, parent). Non-assignable roles are hidden entirely. Consistent with FR-009.

- [x] CHK015 - Do FR-021 (seeded master_admin) and the Assumption "all users sign up via OAuth and get student role initially" coexist without contradiction? The seed account bypasses the OAuth sign-up flow. [Conflict, Spec §FR-021 vs Assumptions]
  > **Resolved**: Assumptions updated — "all users sign up via OAuth" now explicitly notes the master_admin seed account as a documented bootstrap exception. Assumption A8 added.

- [x] CHK016 - Does SC-008 ("next login") align with FR-018 ("real time" propagation)? If role changes propagate in real time, should the user's dashboard switch immediately without requiring a new login? [Conflict, Spec §SC-008 vs FR-018]
  > **Resolved**: FR-018 clarified — "real time" applies to auth state events (sign-in, sign-out, token refresh) via `onAuthStateChange`. Role changes take effect on next login (SC-008 is correct). Active session continues with old role until user signs out and back in.

## Acceptance Criteria Quality

- [x] CHK017 - Are measurement mechanisms defined for SC-001 (90% registration under 60s) and SC-002 (95% success rate)? Is there a requirement for analytics or telemetry to capture these metrics? [Measurability, Spec §SC-001/SC-002]
  > **Resolved**: SC-001 and SC-002 clarified — measured via manual QA testing during acceptance phase. Formal analytics/telemetry for ongoing monitoring is out of scope for this spec (noted in Out of Scope).

- [x] CHK018 - Is SC-004 ("verified by build inspection") specific enough — what constitutes a passing inspection (grep for component name, automated test, manual review)? [Measurability, Spec §SC-004]
  > **Resolved**: SC-004 clarified — "build inspection" means: (1) `DevRolePills` component is wrapped in `__DEV__` check, (2) production bundle (via `npx expo export`) does not contain dev pill component code, verified by searching the bundle output.

- [x] CHK019 - Are the specific Google and Apple compliance requirements referenced in SC-006 enumerated or linked, so they can be objectively validated? [Measurability, Spec §SC-006]
  > **Resolved**: SC-006 clarified — compliance means: (1) Google: uses native `signInWithIdToken` flow (not web redirect), client IDs per platform. (2) Apple: uses `expo-apple-authentication` native module, includes nonce for security, handles first-login name. Links to provider guidelines added.

## Scenario Coverage

- [x] CHK020 - Are requirements defined for the returning-user flow — a user who already has an account opens the app; are they automatically signed in via persisted session, or must they tap OAuth again? [Gap, Recovery Flow]
  > **Resolved**: US1 Scenario 3 added — returning user with valid persisted session is automatically signed in and routed to their role-specific dashboard. US1 Scenario 4 added — expired session redirects to login screen.

- [x] CHK021 - Are requirements defined for interrupted onboarding recovery — if a user force-closes the app during onboarding and reopens, do they see onboarding again or skip to the dashboard? [Gap, Spec §US4]
  > **Resolved**: US4 Scenario 3 added — interrupted onboarding recovery. If `onboarding_completed=false`, user sees onboarding screen on every app open until completed or skipped. FR-027 added for persistence.

- [x] CHK022 - Are requirements defined for what happens to an active session when a user's role is changed by an admin — is the session invalidated, does the dashboard switch immediately, or does it take effect on next login? [Gap, Spec §FR-018/SC-008]
  > **Resolved**: Edge case EC-012 added — active session continues with old role. New role takes effect on next sign-in. No mid-session dashboard switch. Consistent with FR-018 and SC-008.

- [x] CHK023 - Are requirements defined for the sign-out flow changes — does signing out of the app also revoke the OAuth provider session, or only the local app session? [Gap, Spec §Scope]
  > **Resolved**: In Scope clarified — sign-out clears local Supabase session and SecureStore tokens only. Does not revoke the Google/Apple provider session. User remains signed into their Google/Apple account on the device.

## Edge Case Coverage

- [x] CHK024 - Are requirements defined for the scenario where both Google and Apple OAuth are simultaneously unavailable (e.g., regional outage)? Is there a fallback or just an error message? [Gap, Edge Cases]
  > **Resolved**: Edge case EC-013 added — if both providers are unavailable, show localized error message ("Sign-in services are temporarily unavailable. Please try again later."). No fallback to password auth. Dev pills still work in `__DEV__` builds.

- [x] CHK025 - Are requirements defined for OAuth token refresh failure during an active session (token expires and refresh fails while user is using the app)? [Gap, Edge Cases]
  > **Resolved**: Edge case EC-014 added — Supabase handles token refresh automatically. If refresh fails (e.g., user revoked app access), `onAuthStateChange` fires `SIGNED_OUT` event. User is redirected to login screen.

## Non-Functional Requirements

- [x] CHK026 - Are accessibility requirements defined for the OAuth buttons and dev pills (VoiceOver/TalkBack labels, minimum touch target sizes, focus order)? [Gap, Non-Functional]
  > **Resolved**: FR-026 added — OAuth buttons and dev pills must have accessibility labels (e.g., "Continue with Google", "Sign in as Student"), minimum 44pt touch targets, logical focus order (Google → Apple → dev pills).

- [x] CHK027 - Are observability/logging requirements specified for auth events (sign-in attempts, failures, role changes) for security monitoring and debugging? [Gap, Non-Functional]
  > **Resolved**: Explicitly deferred to Out of Scope — "Auth event analytics, telemetry, and security monitoring logging." Acknowledged as important but not in scope for this spec.

- [x] CHK028 - Are data privacy requirements specified for OAuth user data storage — what personal data is stored, retention policy, and whether GDPR/privacy compliance applies? [Gap, Non-Functional]
  > **Resolved**: Explicitly deferred to Out of Scope — "GDPR/privacy compliance, data retention policies, and right-to-deletion flows." Acknowledged as important but deferred to a dedicated privacy spec.

## Notes

- CHK013 was the highest-priority finding: reconciled as an intentional deviation from Constitution VII, with a planned amendment.
- CHK008/CHK014 represented the same underlying ambiguity — resolved by making non-assignable roles hidden (not disabled) for regular admins.
- CHK020-CHK023 scenario gaps all resolved with new acceptance scenarios and edge cases in the spec.
- CHK026-CHK028 non-functional gaps: CHK026 resolved with FR-026; CHK027 and CHK028 explicitly deferred in Out of Scope.
- All 28 items resolved via spec rewrite on 2026-03-03.
