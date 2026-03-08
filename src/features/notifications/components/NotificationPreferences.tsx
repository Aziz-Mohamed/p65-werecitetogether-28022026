import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { colors, lightTheme, primary, neutral } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import { useAuthStore } from '@/stores/authStore';
import { TimePicker, formatTimeHHMM, parseTimeString } from '@/components/forms/TimePicker';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/useNotificationPreferences';
import { getCategoriesForRole } from '../config/notification-categories';
import type { UserRole, NotificationPreferencesForm } from '../types/notifications.types';

const DEFAULT_PREFS: NotificationPreferencesForm = {
  sticker_awarded: true,
  trophy_earned: true,
  achievement_unlocked: true,
  attendance_marked: true,
  session_completed: true,
  daily_summary: true,
  student_alert: true,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const role = (profile?.role as UserRole) ?? 'student';
  const userId = profile?.id;

  const { data: prefs, isLoading } = useNotificationPreferences(userId);
  const { mutate: updatePrefs } = useUpdateNotificationPreferences(userId);

  const { control, reset, watch } = useForm<NotificationPreferencesForm>({
    defaultValues: DEFAULT_PREFS,
  });

  const quietHoursEnabled = watch('quiet_hours_enabled');

  // Sync fetched preferences into the form
  useEffect(() => {
    if (prefs) {
      reset({
        sticker_awarded: prefs.sticker_awarded,
        trophy_earned: prefs.trophy_earned,
        achievement_unlocked: prefs.achievement_unlocked,
        attendance_marked: prefs.attendance_marked,
        session_completed: prefs.session_completed,
        daily_summary: prefs.daily_summary,
        student_alert: prefs.student_alert,
        quiet_hours_enabled: prefs.quiet_hours_enabled,
        quiet_hours_start: prefs.quiet_hours_start,
        quiet_hours_end: prefs.quiet_hours_end,
      });
    }
  }, [prefs, reset]);

  // Auto-save on toggle change
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name && userId) {
        updatePrefs({ [name]: values[name] });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updatePrefs, userId]);

  const categories = getCategoriesForRole(role);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primary[600]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('notifications.preferences.title')}</Text>
      <Text style={styles.subtitle}>{t('notifications.preferences.subtitle')}</Text>

      {/* Category toggles */}
      <View style={styles.section}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.row}>
            <View style={styles.rowLeading}>
              <Ionicons
                name={cat.icon as any}
                size={normalize(20)}
                color={primary[600]}
                style={styles.rowIcon}
              />
              <View style={styles.rowText}>
                <Text style={styles.label}>{t(cat.labelKey)}</Text>
                <Text style={styles.description}>{t(cat.descriptionKey)}</Text>
              </View>
            </View>
            <Controller
              control={control}
              name={cat.preferenceColumn as keyof NotificationPreferencesForm}
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value as boolean}
                  onValueChange={onChange}
                  trackColor={{ true: primary[600], false: neutral[300] }}
                  thumbColor={colors.white}
                />
              )}
            />
          </View>
        ))}
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('notifications.preferences.quietHours')}
        </Text>
        <Text style={styles.sectionDescription}>
          {t('notifications.preferences.quietHoursDescription')}
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>
            {t('notifications.preferences.quietHours')}
          </Text>
          <Controller
            control={control}
            name="quiet_hours_enabled"
            render={({ field: { value, onChange } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: primary[600], false: neutral[300] }}
                thumbColor={colors.white}
              />
            )}
          />
        </View>
        {quietHoursEnabled && (
          <View style={styles.timePickerRow}>
            <Controller
              control={control}
              name="quiet_hours_start"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  label={t('notifications.preferences.quietHoursStart')}
                  value={value ? parseTimeString(value) : null}
                  onChange={(date) => onChange(formatTimeHHMM(date))}
                  style={styles.timePicker}
                />
              )}
            />
            <Controller
              control={control}
              name="quiet_hours_end"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  label={t('notifications.preferences.quietHoursEnd')}
                  value={value ? parseTimeString(value) : null}
                  onChange={(date) => onChange(formatTimeHHMM(date))}
                  style={styles.timePicker}
                />
              )}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  content: {
    padding: normalize(16),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: normalize(22),
    fontWeight: '700',
    color: lightTheme.text,
    marginBlockEnd: normalize(4),
  },
  subtitle: {
    fontSize: normalize(14),
    color: lightTheme.textSecondary,
    marginBlockEnd: normalize(24),
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    marginBlockEnd: normalize(16),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: lightTheme.text,
    paddingVertical: normalize(12),
  },
  sectionDescription: {
    fontSize: normalize(13),
    color: lightTheme.textTertiary,
    marginBlockEnd: normalize(8),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: normalize(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  rowLeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginInlineEnd: normalize(12),
  },
  rowIcon: {
    marginTop: normalize(2),
    marginInlineEnd: normalize(12),
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: normalize(15),
    fontWeight: '600',
    color: neutral[700],
  },
  description: {
    fontSize: normalize(12),
    color: lightTheme.textTertiary,
    marginTop: normalize(2),
    lineHeight: normalize(16),
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: normalize(12),
    paddingVertical: normalize(12),
  },
  timePicker: {
    flex: 1,
  },
});
