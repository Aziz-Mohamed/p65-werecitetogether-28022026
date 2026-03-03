# Feature Specification: Auth Evolution (OAuth)

**Feature Branch**: `001-auth-evolution`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Auth Evolution - Replace synthetic email auth with OAuth-only (Google + Apple), student self-registration, dev role pills for simulator testing"

## Clarifications

### Session 2026-03-02

- Q: Where do new roles (supervisor, program_admin, master_admin) land after login, given their dedicated dashboards are out of scope? → A: They land on a role-specific placeholder/coming-soon screen. Auth works for all 7 roles, but new roles see "Your dashboard is being built" until spec 007-admin-roles delivers their dashboards.
- Q: Should the app keep synthetic email/password alongside OAuth, or go OAuth-only? → A: OAuth only (Google + Apple) in production. The existing synthetic email system is fully replaced. In development builds, the login screen shows role-based test pills so developers can simulate any role on the simulator without real OAuth.
- Q: Which roles can a regular admin assign vs. only a master_admin? → A: Regular admins can assign student, teacher, and parent only. Master_admins can assign all 7 roles (including supervisor, program_admin, admin, and master_admin).

### Session 2026-03-03 (checklist resolution)

- Q: Is the login screen a unified flow or separate sign-up/sign-in? → A: Single unified flow. One "Continue with Google" and one "Continue with Apple" button. The auth provider handles both new and returning users transparently — no separate sign-up vs sign-in distinction.
- Q: Does FR-022 (remove synthetic email) conflict with Constitution VII (preserve password-based auth during transition)? → A: Intentional deviation. The clarification on 2026-03-02 explicitly chose OAuth-only, superseding Constitution VII's coexistence language. Constitution VII will be amended after this spec is implemented to reflect the OAuth-only decision.
- Q: Does role change take effect in real-time or on next login? → A: Next login. FR-018's "real time" applies to auth state events (sign-in, sign-out, token refresh). Role changes take effect on next login because route groups are determined at login time.

## User Scenarios & Testing

### User Story 1 - Student Self-Registration via OAuth (Priority: P1)

A prospective student opens the app for the first time and taps "Continue with Google" (or "Continue with Apple"). The system authenticates via the chosen OAuth provider, creates a new account with the default role of "student," and lands the user on the student dashboard. The student can immediately browse available content and begin using the app. Returning users who already have an account are automatically signed in via their persisted session without needing to tap the OAuth button again.

**Why this priority**: Self-registration is the primary growth mechanism for WeReciteTogether. Without it, every user must be manually created by an admin, which is the biggest bottleneck for scaling. This story alone delivers immediate user acquisition value.

**Independent Test**: Create a fresh account via Google OAuth on a test device (or use dev role pills on a simulator). Verify the user lands on the student dashboard with role "student" and can see available content. Repeat with Apple Sign-In on a physical device. Verify both locales (English and Arabic) display correctly throughout the flow.

**Acceptance Scenarios**:

1. **Given** the app is installed and the user has no account, **When** the user taps "Continue with Google" and completes the Google consent screen, **Then** a new profile is created with role "student," the user is signed in, and the student dashboard is displayed.
2. **Given** the app is installed and the user has no account, **When** the user taps "Continue with Apple" and completes the Apple consent screen, **Then** a new profile is created with role "student," the user is signed in, and the student dashboard is displayed.
3. **Given** the user is on the login screen with Arabic locale active, **When** the user taps the Google OAuth button, **Then** all app-controlled text (button labels, loading indicators, error messages) appears in Arabic.
4. **Given** the user cancels the OAuth consent screen midway, **When** control returns to the app, **Then** the user remains on the login screen with no partial account created.
5. **Given** the user's device has no internet connection, **When** the user taps an OAuth button, **Then** a localized offline error message is displayed.
6. **Given** a returning user who previously signed in and has a valid persisted session, **When** they open the app, **Then** they are automatically signed in and routed to their role-appropriate dashboard without seeing the login screen.
7. **Given** a returning user whose persisted session has expired, **When** they open the app, **Then** they see the login screen and must re-authenticate via OAuth.

---

### User Story 2 - Development Mode Role Testing (Priority: P2)

During development, OAuth providers are not available on iOS/Android simulators. The login screen in development builds shows a set of role-based test pills (e.g., "Student," "Teacher," "Admin," "Supervisor," etc.). Tapping a pill signs the developer in as a test user with that role, bypassing OAuth entirely. This allows rapid testing of all role-based flows without needing real OAuth credentials or a physical device.

**Why this priority**: Without this, developers cannot test any auth-dependent features on simulators, which blocks all development work. This is a critical enabler for the entire development lifecycle.

**Independent Test**: Launch the app on the iOS simulator in development mode. Verify role pills are visible on the login screen. Tap "Teacher" pill — verify you are signed in with a teacher role and see the teacher dashboard. Sign out, tap "Admin" — verify you see the admin dashboard. Confirm the pills are NOT visible when building for production.

**Acceptance Scenarios**:

1. **Given** the app is running in a development build, **When** the login screen loads, **Then** role-based test pills are displayed for all 7 roles: student, teacher, parent, admin, supervisor, program_admin, master_admin.
2. **Given** the developer taps the "Teacher" pill, **When** the sign-in completes, **Then** a test user with role "teacher" is signed in and the teacher dashboard is displayed.
3. **Given** the developer taps the "Supervisor" pill, **When** the sign-in completes, **Then** a test user with role "supervisor" is signed in and the role-specific placeholder screen is displayed.
4. **Given** the app is built as a production release, **When** the login screen loads, **Then** no role pills are visible — only the OAuth sign-in buttons are shown.
5. **Given** a developer is signed in via a role pill, **When** they sign out, **Then** they return to the login screen and can select a different role pill.

---

### User Story 3 - Admin Role Promotion (Priority: P3)

All users sign up via OAuth and receive the "student" role by default. To assign privileged roles (teacher, supervisor, program_admin, master_admin), an admin or master_admin navigates to the user management screen, finds the user, and changes their role. The role selector shows only the roles the current admin is permitted to assign. The user's next login reflects their new role and corresponding dashboard.

**Why this priority**: The platform needs supervisor, program_admin, and master_admin roles to operate its multi-program structure. While students can self-register (US1), privileged roles require admin promotion for security. This story enables the organizational hierarchy.

**Independent Test**: Sign up as a new user via OAuth (gets student role). Log in as an admin. Navigate to user management, find the new user, and promote them to "teacher." Log in as the promoted user and verify they now see the teacher dashboard.

**Acceptance Scenarios**:

1. **Given** a regular admin is on the user management screen, **When** they select a user and open the role editor, **Then** only the roles they can assign are shown: student, teacher, parent. Roles requiring master_admin privileges (supervisor, program_admin, admin, master_admin) are hidden.
2. **Given** a master_admin is on the user management screen, **When** they select a user and open the role editor, **Then** all seven roles are shown: student, teacher, parent, admin, supervisor, program_admin, master_admin.
3. **Given** an admin changes a user's role from "student" to "teacher," **When** the user logs in next, **Then** they see the teacher dashboard (not the student dashboard).
4. **Given** a master_admin promotes a user to "program_admin," **When** the program_admin logs in, **Then** they see a role-specific placeholder screen indicating their dashboard is coming soon.
5. **Given** the first master_admin account, **When** the system is initially deployed, **Then** a seeded master_admin account exists in the database to bootstrap the role hierarchy.

---

### User Story 4 - Post-Registration Onboarding (Priority: P4)

After a new student completes OAuth sign-up, they are guided through a brief onboarding flow that collects their display name, preferred language (English or Arabic), and an optional short bio. This information enriches their profile and personalizes the app experience from the first session.

**Why this priority**: While the app functions without onboarding (US1 delivers a working account), collecting basic demographics improves personalization and helps teachers/admins identify students. This is a polish story that enhances the new user experience.

**Independent Test**: Register a new account via OAuth. Verify the onboarding screen appears. Fill in name and language, skip bio. Verify the profile is updated and the student dashboard reflects the chosen language. Repeat but skip all optional fields — verify the user still reaches the dashboard.

**Acceptance Scenarios**:

1. **Given** a new user has just completed OAuth sign-up, **When** the sign-up completes, **Then** the onboarding screen is displayed before the main dashboard.
2. **Given** the onboarding screen is displayed, **When** the user enters their display name and selects a preferred language, **Then** the profile is updated with these values.
3. **Given** the onboarding screen is displayed, **When** the user taps "Skip" without entering any information, **Then** the user proceeds to the student dashboard with default values (OAuth display name, device language).
4. **Given** the user completes onboarding with Arabic as preferred language, **When** the dashboard loads, **Then** the entire app switches to Arabic locale.
5. **Given** a user who previously closed the app during onboarding (before completing it), **When** they reopen the app, **Then** the onboarding screen is shown again (tracked via the `onboarding_completed` profile field).

---

### Edge Cases

- **Duplicate email across providers**: A user signs up with Google (email: user@gmail.com), then later tries Apple Sign-In with the same email. The system detects the existing account and links the new provider to it rather than creating a duplicate. This applies only to OAuth-to-OAuth deduplication — no legacy synthetic email accounts exist in the new system.
- **OAuth provider outage**: Google or Apple's OAuth service is temporarily unavailable. The app displays a localized error message categorized as "provider" error and suggests trying the other provider.
- **Both providers unavailable**: If both Google and Apple OAuth are simultaneously unavailable (e.g., regional outage), the app displays an error message suggesting the user try again later. There is no offline authentication fallback.
- **Revoked OAuth permissions**: A user revokes the app's OAuth permissions from their Google/Apple account settings. On next app launch, the refresh token fails. The app prompts re-authentication by redirecting to the login screen.
- **Token refresh failure mid-session**: A user's session token expires and the automatic refresh fails during active app use. The user is redirected to the login screen to re-authenticate via OAuth.
- **Email hiding (Apple)**: Apple's "Hide My Email" feature generates a relay address. The system treats relay emails as valid unique identifiers without confusing them with the user's real email.
- **Concurrent sessions**: A user signs in on multiple devices simultaneously via OAuth. Auth state changes (sign-in, sign-out, token refresh) propagate to all active sessions in real time. Role changes by an admin take effect on the user's next login, not during active sessions.
- **Active session role change**: An admin changes a user's role while the user has an active session. The active session continues with the old role. On next login, the user sees the dashboard for their new role.
- **Network interruption during callback**: The native OAuth library handles the provider flow internally. If the network drops before the token exchange completes, the app shows a "network" error and allows retry.
- **Role escalation prevention**: A self-registered student must never be able to change their own role to teacher, admin, supervisor, program_admin, or master_admin through any client-side manipulation. Role changes are enforced at the data layer.
- **Rapid repeated OAuth attempts**: A user taps the OAuth button multiple times quickly. The system debounces the requests and prevents multiple concurrent OAuth flows.
- **Dev pills in production**: The role-based test pills must be completely absent from production builds. There must be no code path that enables them outside of development mode.
- **First admin bootstrap**: On initial deployment, no admin exists to promote other users. A seeded master_admin account must be present in the database to bootstrap the role hierarchy. In development, this is automated via `supabase/seed.sql`. In production, the master_admin is provisioned via a direct database insert during initial setup.
- **Role demotion**: An admin demotes a user from "teacher" back to "student." On next login, the user sees the student dashboard with no residual teacher-level access.
- **Interrupted onboarding**: A user closes the app during onboarding before completing it. On next app open, onboarding is shown again (tracked via the `onboarding_completed` profile field).

## Requirements

### Functional Requirements

- **FR-001**: System MUST support Google OAuth sign-in as the primary authentication method in production.
- **FR-002**: System MUST support Apple OAuth sign-in as the primary authentication method in production (required for iOS App Store compliance per App Store Review Guidelines 4.8).
- **FR-003**: New users signing up via OAuth MUST be automatically assigned the "student" role.
- **FR-004**: In development builds, the login screen MUST display role-based test pills for all 7 roles, allowing sign-in as a test user without OAuth.
- **FR-005**: Role-based test pills MUST be completely absent from production builds — no code path may enable them outside development mode. Verified by automated search for the dev pills component in the production bundle.
- **FR-006**: The production login screen MUST display exactly two OAuth buttons: "Continue with Google" and "Continue with Apple." Both buttons handle sign-up and sign-in transparently — there is no separate sign-up vs sign-in flow.
- **FR-007**: The profiles table role constraint MUST accept all seven roles: student, teacher, parent, admin, supervisor, program_admin, master_admin.
- **FR-008**: Self-registration (OAuth sign-up) MUST only create accounts with the "student" role — no other role is selectable during self-registration.
- **FR-009**: Regular admins MUST only see and assign the roles: student, teacher, and parent in the role editor. Roles requiring master_admin privileges (supervisor, program_admin, admin, master_admin) MUST be hidden from regular admins.
- **FR-010**: Master_admins MUST see and assign all seven roles (student, teacher, parent, admin, supervisor, program_admin, master_admin) in the role editor.
- **FR-011**: All auth screens, buttons, error messages, role labels, and onboarding fields MUST be localized in both English and Arabic, including the display names of all 7 roles (e.g., "Student" / "طالب", "Teacher" / "معلم", etc.).
- **FR-012**: Failed OAuth attempts MUST display a localized error message categorized by type: "network" (no connection/timeout), "cancelled" (user dismissed the provider screen), "provider" (Google/Apple returned an error), or "unknown" (unexpected failure). No technical details (error codes, stack traces) are exposed.
- **FR-013**: The system MUST prevent duplicate accounts by detecting when an OAuth email matches an existing profile's email and linking the new provider to the existing account. This applies to OAuth-to-OAuth deduplication only (e.g., same email used with Google and Apple).
- **FR-014**: When Apple's "Hide My Email" relay address is used, the system MUST treat it as a valid unique identifier and store it as the user's email.
- **FR-015**: Post-registration onboarding MUST collect display name and preferred language (English or Arabic) from new OAuth users.
- **FR-016**: All onboarding fields except display name MUST be skippable, with sensible defaults applied (OAuth provider's display name, device locale).
- **FR-017**: Existing RLS policies MUST continue to function correctly after the role constraint is extended to seven roles.
- **FR-018**: Auth state events (sign-in, sign-out, token refresh) MUST propagate to the app in real time across all active sessions. Role changes by an admin take effect on the user's next login, not during active sessions.
- **FR-019**: The system MUST store which OAuth provider(s) a user has linked (e.g., "google," "apple") for account management and analytics.
- **FR-020**: Role escalation MUST be prevented at the data layer — a user MUST NOT be able to change their own role via any client-side action.
- **FR-021**: A seeded master_admin account MUST exist in the database on initial deployment to bootstrap the role hierarchy. In development, this is automated via `supabase/seed.sql`. In production, the master_admin is provisioned via a direct database insert during initial setup.
- **FR-022**: The existing synthetic email/password auth system MUST be fully removed: login screen username/password form, `buildSyntheticEmail` helper, `create-school` edge function, `reset-member-password` edge function, synthetic email types, and all related auth service methods. This is an intentional deviation from Constitution VII (see Clarifications 2026-03-03).
- **FR-023**: The login screen MUST show a loading indicator between the user tapping an OAuth button and receiving the provider's response.
- **FR-024**: Role-specific placeholder screens (for supervisor, program_admin, master_admin) MUST display the app logo, the user's role title (localized), a "Your dashboard is coming soon" message (localized), and a sign-out button.
- **FR-025**: When the OAuth provider supplies an avatar URL (e.g., Google's `picture` field), the system MUST store it on the profile's `avatar_url` field. If no avatar is provided (e.g., Apple), the field remains null.
- **FR-026**: OAuth buttons and dev role pills MUST have accessibility labels for screen readers (VoiceOver/TalkBack) and MUST meet minimum touch target sizes (44x44 points).
- **FR-027**: If a user has not completed onboarding (`onboarding_completed` is false), the app MUST show the onboarding screen on every app open until the user completes or skips it.

### Key Entities

- **Profile** (extended): Existing user profile, extended with an expanded role set (7 roles) and optional onboarding fields (bio, preferred language). Uniquely identified by user ID. Each profile may be linked to one or more OAuth providers. The profile's email is the OAuth provider's email. Includes `avatar_url` (from OAuth provider when available) and `onboarding_completed` (boolean tracking onboarding state).
- **OAuth Provider Link**: Managed natively by Supabase Auth via the `auth.identities` table. Stores the provider type (google, apple), the provider's unique user identifier, and the email used. A single profile can have multiple provider links (e.g., both Google and Apple). No custom table needed.
- **Onboarding Response**: Captures the display name, preferred language, and optional bio collected during post-registration onboarding. Stored directly on the profile entity rather than as a separate record.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 90% of new users complete OAuth registration (from tapping "Continue with" to reaching the student dashboard) in under 60 seconds. This is a design target; analytics instrumentation for measurement is deferred to a future spec.
- **SC-002**: OAuth sign-in success rate (attempts resulting in successful authentication) exceeds 95% under normal network conditions. Measurement instrumentation deferred to a future spec.
- **SC-003**: 80% of new users complete the post-registration onboarding flow within 2 minutes. Measurement instrumentation deferred to a future spec.
- **SC-004**: Zero role-based test pills are present in production builds — verified by automated search for the `DevRolePills` component reference in the production JavaScript bundle.
- **SC-005**: All 7 roles can be created and authenticated within the system. Existing roles (student, teacher, parent, admin) land on their established dashboards. New roles (supervisor, program_admin, master_admin) land on a role-specific placeholder screen until their dashboards are delivered in spec 007-admin-roles.
- **SC-006**: The app passes Google Play sign-in branding guidelines and Apple App Store Review Guidelines 4.8 (Sign in with Apple required when third-party sign-in is offered).
- **SC-007**: Developers can sign in as any of the 7 roles on the simulator using test pills in under 5 seconds.
- **SC-008**: Admin role promotion takes effect on the user's next login — the user sees the dashboard corresponding to their new role. Active sessions are not disrupted; the old role persists until next login.

## Assumptions

- Google OAuth and Apple Sign-In are the only two OAuth providers needed at launch. Additional providers (e.g., Microsoft, Facebook) are out of scope.
- The Quran School codebase already has Supabase Auth integrated, which natively supports Google and Apple OAuth providers — no third-party auth library is needed.
- Apple Sign-In is required for iOS App Store compliance since the app offers third-party sign-in (Google).
- The existing synthetic email auth system is fully replaced by OAuth. There is no coexistence period — the old login flow is removed. This intentionally deviates from Constitution VII, which will be amended post-implementation.
- All users (including teachers, admins, etc.) sign up via OAuth and get the "student" role initially. Privileged roles are assigned by admins through the user management interface after sign-up.
- A seeded master_admin account is required to bootstrap the admin hierarchy on first deployment. This is a bootstrap exception to the "all users sign up via OAuth" rule — the seed account is pre-created in the database without going through the OAuth flow.
- The three new roles (supervisor, program_admin, master_admin) are created in the auth system but their dedicated route groups and dashboards are delivered in a separate spec (007-admin-roles). This spec only ensures the roles can be assigned and authenticated, with placeholder screens for the new roles.
- Onboarding collects minimal demographics (display name, language, optional bio). Extended demographics (age, location, educational background) are deferred to a future spec.
- Rate limiting on OAuth endpoints follows platform defaults. Custom rate limiting is out of scope for this spec.
- Development test pills create or sign in as pre-seeded test users in the local/development database. They do not interact with the production auth system.
- Native OAuth libraries (@react-native-google-signin and expo-apple-authentication) handle the provider flow internally on the device. No deep linking or URL scheme configuration is needed for OAuth callbacks — the native libraries do not use browser redirects.
- Returning users with a valid persisted session are auto-signed-in on app open without re-tapping OAuth buttons. Session persistence is managed by Supabase's SecureStore adapter.
- Sign-out clears the local Supabase session only. The OAuth provider session (Google/Apple account) is not revoked — this is standard mobile app behavior.
- SC-001, SC-002, and SC-003 are aspirational design targets. Analytics instrumentation for measuring these metrics is deferred to a future spec.
- Only OAuth-provided email and display name are stored as personal data. No additional PII is collected beyond onboarding fields (name, language, bio).

## Scope Boundaries

### In Scope

- Google and Apple OAuth integration (production)
- Student self-registration via OAuth
- Role-based test pills for development builds (simulator testing)
- Role constraint extension to 7 roles
- Admin role promotion (change user roles via user management)
- Post-registration onboarding (name, language, bio)
- Login screen with OAuth-only buttons (production)
- Removal of existing synthetic email/password auth system
- Seeded master_admin account for bootstrapping
- Role-specific placeholder screens for new roles (logo, role title, coming-soon message, sign-out)
- i18n support for all new auth screens, role labels, and error messages (English and Arabic)
- Accessibility labels and touch targets for OAuth buttons and dev pills
- Loading states during OAuth flow
- Avatar URL storage from OAuth providers

### Out of Scope

- Dedicated dashboards/route groups for supervisor, program_admin, master_admin (spec 007-admin-roles)
- Programs, enrollment, and cohort management (spec 003-programs-enrollment)
- Teacher availability and green-dot system (spec 004-teacher-availability)
- Additional OAuth providers beyond Google and Apple
- Two-factor authentication (2FA)
- Password-based self-registration or login
- Automated account merge tooling
- Invite links or invitation codes for role assignment
- Auth event logging/observability instrumentation (deferred to future spec)
- Analytics instrumentation for success criteria metrics (deferred to future spec)
- GDPR/privacy compliance tooling and data retention policies (deferred to dedicated compliance spec)

## Dependencies

- **001-phase0-setup** (completed): Branch setup, branding updates, work-attendance removal, and deprecation comments must be in place before auth evolution begins.
- **Supabase Auth**: The platform's authentication service must support Google and Apple OAuth providers (it does natively).
- **Apple Developer Account**: Required for Apple Sign-In configuration (App ID, Services ID, key) and App Store Review Guidelines 4.8 compliance.
- **Google Cloud Console**: Required for Google OAuth configuration (OAuth 2.0 client IDs for iOS, Android, and web).
