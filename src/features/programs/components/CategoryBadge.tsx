import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { getCategoryVariant } from '../utils/enrollment-helpers';
import type { ProgramCategory } from '../types/programs.types';

interface CategoryBadgeProps {
  category: ProgramCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      label={t(`programs.category.${category}`)}
      variant={getCategoryVariant(category)}
      size="sm"
    />
  );
}
