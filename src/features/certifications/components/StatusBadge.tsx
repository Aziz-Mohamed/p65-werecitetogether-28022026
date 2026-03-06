import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/Badge';
import type { CertificationStatus } from '../types/certifications.types';

const statusVariantMap: Record<CertificationStatus, 'info' | 'warning' | 'success' | 'error' | 'default'> = {
  recommended: 'info',
  supervisor_approved: 'warning',
  issued: 'success',
  returned: 'warning',
  rejected: 'error',
  revoked: 'default',
};

interface StatusBadgeProps {
  status: CertificationStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      label={t(`certifications.statuses.${status}`)}
      variant={statusVariantMap[status]}
      size={size}
    />
  );
}
