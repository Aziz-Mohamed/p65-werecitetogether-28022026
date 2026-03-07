import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useSchoolSettings, useUpdateSchoolSettings } from '@/features/schools';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Permissions Settings ─────────────────────────────────────────────────────

export default function PermissionsSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolId } = useAuth();

  const { data: settings, isLoading, error, refetch } = useSchoolSettings(schoolId ?? undefined);
  const updateMutation = useUpdateSchoolSettings();

  const [teacherCanCreate, setTeacherCanCreate] = useState(true);

  useEffect(() => {
    if (settings) {
      setTeacherCanCreate(settings.teacher_can_create_sessions !== false);
    }
  }, [settings]);

  const handleSave = () => {
    if (!schoolId) return;

    updateMutation.mutate(
      { schoolId, settings: { teacher_can_create_sessions: teacherCanCreate } },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('admin.permissions.saved'));
        },
        onError: (err: Error) => {
          Alert.alert(t('common.error'), err.message);
        },
      },
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('admin.permissions.title')}</Text>
        <Text style={styles.description}>{t('admin.permissions.description')}</Text>

        {/* Teacher Session Creation Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>
              {t('admin.permissions.teacherCanCreateSessions')}
            </Text>
            <Text style={styles.settingHint}>
              {t('admin.permissions.teacherCanCreateSessionsHint')}
            </Text>
          </View>

          <View style={styles.pillRow}>
            {([true, false] as const).map((val) => (
              <Pressable
                key={String(val)}
                style={[styles.pill, teacherCanCreate === val && styles.pillActive]}
                onPress={() => setTeacherCanCreate(val)}
                accessibilityRole="radio"
                accessibilityState={{ selected: teacherCanCreate === val }}
              >
                <Ionicons
                  name={val ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={teacherCanCreate === val ? colors.white : colors.neutral[600]}
                />
                <Text style={[styles.pillText, teacherCanCreate === val && styles.pillTextActive]}>
                  {val ? t('common.active') : t('common.inactive')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Save */}
        <Button
          title={t('common.save')}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={updateMutation.isPending}
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  settingRow: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  settingInfo: {
    gap: spacing.xs,
  },
  settingLabel: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  settingHint: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: normalize(12),
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  pillActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pillText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[600],
  },
  pillTextActive: {
    color: colors.white,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
