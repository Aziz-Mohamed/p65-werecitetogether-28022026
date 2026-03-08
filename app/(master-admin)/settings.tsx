import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { usePlatformConfig } from '@/features/admin/hooks/usePlatformConfig';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import type { UpdatePlatformConfigInput, PlatformConfigSettings } from '@/features/admin/types/admin.types';
import type { MeetingPlatform } from '@/features/teacher-availability/types/availability.types';

const MEETING_PLATFORMS: { value: MeetingPlatform; label: string }[] = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'jitsi', label: 'Jitsi' },
  { value: 'other', label: 'Other' },
];

interface FormValues {
  name: string;
  name_ar: string;
  default_meeting_platform: MeetingPlatform | '';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export default function PlatformSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const config = usePlatformConfig();
  const notificationDefaults = config.data?.settings?.notification_defaults;

  const { control, handleSubmit } = useForm<FormValues>({
    values: {
      name: config.data?.name ?? 'WeReciteTogether',
      name_ar: config.data?.name_ar ?? 'نتلو معاً',
      default_meeting_platform: config.data?.default_meeting_platform ?? '',
      quiet_hours_enabled: notificationDefaults?.quiet_hours_enabled ?? false,
      quiet_hours_start: notificationDefaults?.quiet_hours_start ?? '22:00',
      quiet_hours_end: notificationDefaults?.quiet_hours_end ?? '06:00',
    },
  });

  const onSubmit = (data: FormValues) => {
    const input: UpdatePlatformConfigInput = {
      name: data.name,
      name_ar: data.name_ar,
      default_meeting_platform: data.default_meeting_platform || null,
      settings: {
        notification_defaults: {
          quiet_hours_enabled: data.quiet_hours_enabled,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
        },
      },
    };

    config.update.mutate(input, {
      onSuccess: () => Alert.alert(t('common.success'), t('admin.masterAdmin.settings.saveSuccess')),
      onError: () => Alert.alert(t('common.error'), t('admin.masterAdmin.settings.saveError')),
    });
  };

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('admin.masterAdmin.settings.title')}</Text>

        <Text style={styles.label}>{t('admin.masterAdmin.settings.platformName')}</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} value={value} onChangeText={onChange} />
          )}
        />

        <Text style={styles.label}>{t('admin.masterAdmin.settings.platformNameAr')}</Text>
        <Controller
          control={control}
          name="name_ar"
          render={({ field: { onChange, value } }) => (
            <TextInput style={[styles.input, styles.rtlInput]} value={value} onChangeText={onChange} />
          )}
        />

        <Text style={styles.label}>{t('admin.masterAdmin.settings.meetingPlatform')}</Text>
        <Controller
          control={control}
          name="default_meeting_platform"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chipRow}>
              {MEETING_PLATFORMS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[styles.chip, value === p.value && styles.chipActive]}
                  onPress={() => onChange(value === p.value ? '' : p.value)}
                >
                  <Text style={[styles.chipText, value === p.value && styles.chipTextActive]}>
                    {t(`admin.masterAdmin.settings.meetingPlatformOptions.${p.value}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />

        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.settings.notifications')}</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('admin.masterAdmin.settings.quietHoursEnabled')}</Text>
          <Controller
            control={control}
            name="quiet_hours_enabled"
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary[500] }} />
            )}
          />
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>{t('admin.masterAdmin.settings.quietHoursStart')}</Text>
            <Controller
              control={control}
              name="quiet_hours_start"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.timeInput} value={value} onChangeText={onChange} placeholder="HH:mm" />
              )}
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>{t('admin.masterAdmin.settings.quietHoursEnd')}</Text>
            <Controller
              control={control}
              name="quiet_hours_end"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.timeInput} value={value} onChangeText={onChange} placeholder="HH:mm" />
              )}
            />
          </View>
        </View>

        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          loading={config.update.isPending}
          disabled={config.update.isPending}
          style={styles.saveButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.xl, paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  backButton: { paddingVertical: spacing.sm },
  backText: { ...typography.textStyles.bodyMedium, color: colors.primary[500] },
  title: { ...typography.textStyles.heading, color: lightTheme.text, marginBottom: spacing.xl },
  label: { ...typography.textStyles.label, color: lightTheme.textSecondary, marginTop: spacing.base, marginBottom: spacing.xs, textTransform: 'uppercase' },
  input: { ...typography.textStyles.body, color: lightTheme.text, borderWidth: 1, borderColor: lightTheme.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, height: normalize(44) },
  rtlInput: { textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: lightTheme.border },
  chipActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[500] },
  chipText: { ...typography.textStyles.body, color: lightTheme.textSecondary },
  chipTextActive: { color: colors.primary[700] },
  sectionLabel: { ...typography.textStyles.label, color: lightTheme.textSecondary, marginTop: spacing.xl, marginBottom: spacing.sm, textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  switchLabel: { ...typography.textStyles.body, color: lightTheme.text },
  timeRow: { flexDirection: 'row', gap: spacing.base, marginTop: spacing.sm },
  timeField: { flex: 1, gap: spacing.xs },
  timeLabel: { ...typography.textStyles.caption, color: lightTheme.textSecondary },
  timeInput: { ...typography.textStyles.body, color: lightTheme.text, borderWidth: 1, borderColor: lightTheme.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, textAlign: 'center' },
  saveButton: { marginTop: spacing.xl },
});
