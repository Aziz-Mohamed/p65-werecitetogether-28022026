import { z } from 'zod';
import type { Gender, AgeRange } from '@/types/common.types';

// ─── Onboarding Schema ─────────────────────────────────────────────────────

export const onboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  gender: z.enum(['male', 'female'] as const),
  ageRange: z.enum([
    'under_13',
    '13_17',
    '18_24',
    '25_34',
    '35_49',
    '50_plus',
  ] as const),
  country: z.string().length(2),
  region: z.string().max(100).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type OnboardingData = z.infer<typeof onboardingSchema>;

export interface OnboardingFormValues {
  fullName: string;
  gender: Gender | '';
  ageRange: AgeRange | '';
  country: string;
  region: string;
}
