import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
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

const TYPES: (CertificationType | null)[] = [null, 'ijazah', 'graduation', 'completion'];
const STATUSES: (CertificationStatus | null)[] = [
  null, 'recommended', 'supervisor_approved', 'issued', 'returned', 'rejected', 'revoked',
];

export default function MasterAdminCertificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [filters, setFilters] = useState<CertificationFilters>({});
  const programs = usePrograms();
  const certs = useAllCertifications(filters);

  const updateFilter = <K extends keyof CertificationFilters>(key: K, value: CertificationFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('certifications.masterAdmin.title')}</Text>

        {/* Filter bar */}
        <View style={styles.filterSection}>
          {/* Program filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip
              label={t('certifications.masterAdmin.allPrograms')}
              active={!filters.programId}
              onPress={() => updateFilter('programId', undefined)}
            />
            {(programs.data ?? []).map((p) => (
              <FilterChip
                key={(p as { id: string }).id}
                label={(p as { name: string }).name}
                active={filters.programId === (p as { id: string }).id}
                onPress={() => updateFilter('programId', (p as { id: string }).id)}
              />
            ))}
          </ScrollView>

          {/* Type filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {TYPES.map((type) => (
              <FilterChip
                key={type ?? 'all-types'}
                label={type ? t(`certifications.types.${type}`) : t('certifications.masterAdmin.allTypes')}
                active={filters.type === type || (!filters.type && !type)}
                onPress={() => updateFilter('type', type ?? undefined)}
              />
            ))}
          </ScrollView>

          {/* Status filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {STATUSES.map((status) => (
              <FilterChip
                key={status ?? 'all-statuses'}
                label={status ? t(`certifications.statuses.${status}`) : t('certifications.masterAdmin.allStatuses')}
                active={filters.status === status || (!filters.status && !status)}
                onPress={() => updateFilter('status', status ?? undefined)}
              />
            ))}
          </ScrollView>
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

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  filterSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterRow: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.border,
    backgroundColor: lightTheme.card,
  },
  chipActive: {
    backgroundColor: lightTheme.text,
    borderColor: lightTheme.text,
  },
  chipText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  chipTextActive: {
    color: lightTheme.card,
    fontWeight: '600',
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
