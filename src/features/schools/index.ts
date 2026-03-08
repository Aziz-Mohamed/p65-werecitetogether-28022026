/** @deprecated The schools module is deprecated. The multi-tenant school system is being replaced with a single-org program-based model. See PRD Section 0.2. */

export { schoolSettingsService } from './services/school-settings.service';
export { useSchoolSettings, useCanTeacherCreateSessions, useUpdateSchoolSettings } from './hooks/useSchoolSettings';
export type { SchoolSettings } from './types/school-settings.types';
