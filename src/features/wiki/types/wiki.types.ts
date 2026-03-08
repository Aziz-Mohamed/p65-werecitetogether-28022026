import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WikiRole = 'student' | 'teacher' | 'supervisor' | 'program_admin' | 'master_admin';

export interface WikiStep {
  /** i18n key for step text */
  textKey: string;
}

export interface WikiTopic {
  id: string;
  /** i18n key for topic title */
  titleKey: string;
  /** i18n key for topic description */
  descriptionKey: string;
  /** Optional step-by-step guide */
  steps?: WikiStep[];
  /** Optional tip callout i18n key */
  tipKey?: string;
}

export interface WikiSection {
  id: string;
  /** i18n key for section title */
  titleKey: string;
  /** i18n key for section subtitle */
  subtitleKey: string;
  /** Ionicons icon name */
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Accent color for icon background */
  color: string;
  /** Topics within this section */
  topics: WikiTopic[];
}

export interface WikiContentConfig {
  /** i18n key for page title */
  pageTitleKey: string;
  /** i18n key for intro text */
  introKey: string;
  /** Sections for this role */
  sections: WikiSection[];
}
