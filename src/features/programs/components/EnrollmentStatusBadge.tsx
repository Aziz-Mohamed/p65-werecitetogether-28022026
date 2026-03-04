import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { getEnrollmentStatusVariant } from '../utils/enrollment-helpers';
import type { EnrollmentStatus } from '../types/programs.types';

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
}

export function EnrollmentStatusBadge({ status }: EnrollmentStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      label={t(`programs.status.${status}`)}
      variant={getEnrollmentStatusVariant(status)}
      size="sm"
    />
  );
}
