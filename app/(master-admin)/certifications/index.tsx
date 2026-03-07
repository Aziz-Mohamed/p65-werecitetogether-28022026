import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, PageHeader } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FilterChips } from '@/components/lists/FilterChips';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CertificationCard } from '@/features/certifications/components/CertificationCard';
import { useAllCertifications } from '@/features/certifications/hooks/useAllCertifications';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import type {
  CertificationType,
  CertificationStatus,
  CertificationFilters,
} from '@/features/certifications/types/certifications.types';

const TYPES: CertificationType[] = ['ijazah', 'graduation', 'completion'];
const STATUSES: CertificationStatus[] = [
  'recommended', 'supervisor_approved', 'issued', 'returned', 'rejected', 'revoked',
];

export default function MasterAdminCertificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [filters, setFilters] = useState<CertificationFilters>({});
  const programs = usePrograms();
  const certs = useAllCertifications(filters);

  const programChips = useMemo(() => [
    { label: t('certifications.masterAdmin.allPrograms'), value: 'all' },
    ...(programs.data ?? []).map((p) => ({
      label: (p as { name: string }).name,
      value: (p as { id: string }).id,
    })),
  ], [programs.data, t]);

  const typeChips = useMemo(() => [
    { label: t('certifications.masterAdmin.allTypes'), value: 'all' },
    ...TYPES.map((type) => ({ label: t(`certifications.types.${type}`), value: type })),
  ], [t]);

  const statusChips = useMemo(() => [
    { label: t('certifications.masterAdmin.allStatuses'), value: 'all' },
    ...STATUSES.map((s) => ({ label: t(`certifications.statuses.${s}`), value: s })),
  ], [t]);

  return (
    <Screen>
      <View style={styles.container}>
        <PageHeader title={t('certifications.masterAdmin.title')} />

        <View style={styles.filterSection}>
          <FilterChips
            chips={programChips}
            selected={filters.programId ?? 'all'}
            onSelect={(v) => setFilters((prev) => ({ ...prev, programId: v === 'all' ? undefined : v }))}
          />
          <FilterChips
            chips={typeChips}
            selected={filters.type ?? 'all'}
            onSelect={(v) => setFilters((prev) => ({ ...prev, type: v === 'all' ? undefined : v as CertificationType }))}
          />
          <FilterChips
            chips={statusChips}
            selected={filters.status ?? 'all'}
            onSelect={(v) => setFilters((prev) => ({ ...prev, status: v === 'all' ? undefined : v as CertificationStatus }))}
          />
        </View>

        <FlashList
          data={certs.data ?? []}
          estimatedItemSize={140}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={certs.isRefetching} onRefresh={() => certs.refetch()} />
          }
          renderItem={({ item }) => {
            const student = (item as Record<string, unknown>).student as { full_name: string } | null;
            const teacher = (item as Record<string, unknown>).teacher as { full_name: string } | null;
            const program = (item as Record<string, unknown>).program as { name: string } | null;
            return (
              <CertificationCard
                id={(item as { id: string }).id}
                studentName={student?.full_name ?? ''}
                teacherName={teacher?.full_name}
                programName={program?.name}
                type={(item as { type: CertificationType }).type}
                status={(item as { status: CertificationStatus }).status}
                title={(item as { title: string }).title}
                createdAt={(item as { created_at: string }).created_at}
                onPress={() =>
                  router.push({
                    pathname: '/(master-admin)/certifications/[id]',
                    params: { id: (item as { id: string }).id },
                  })
                }
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !certs.isLoading ? (
              certs.isError ? (
                <ErrorState onRetry={() => certs.refetch()} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('certifications.queue.empty')}</Text>
                </View>
              )
            ) : null
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
