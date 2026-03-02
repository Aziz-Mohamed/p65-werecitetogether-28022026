import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { StudentGuardian, GuardianNotificationCategory } from '../types/guardians.types';
import { useGuardianNotificationPrefs, useUpdateGuardianNotificationPref } from '../hooks/useGuardianNotificationPrefs';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const NOTIFICATION_CATEGORIES: GuardianNotificationCategory[] = [
  'attendance',
  'session_outcomes',
  'milestones',
];

interface GuardianListProps {
  guardians: StudentGuardian[];
  onEdit: (guardian: StudentGuardian) => void;
  onRemove: (guardianId: string) => void;
  removeLoading?: boolean;
}

export function GuardianList({ guardians, onEdit, onRemove, removeLoading }: GuardianListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRemove = useCallback(
    (guardianId: string, name: string) => {
      Alert.alert(
        t('guardians.removeTitle'),
        t('guardians.removeConfirm', { name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.remove'),
            style: 'destructive',
            onPress: () => onRemove(guardianId),
          },
        ],
      );
    },
    [onRemove, t],
  );

  if (guardians.length === 0) {
    return (
      <Text style={styles.empty}>{t('guardians.noGuardians')}</Text>
    );
  }

  return (
    <View style={styles.container}>
      {guardians.map((guardian) => (
        <Card key={guardian.id} variant="default" style={styles.card}>
          <Pressable
            style={styles.header}
            onPress={() => setExpandedId(expandedId === guardian.id ? null : guardian.id)}
          >
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{guardian.guardian_name}</Text>
              <Text style={styles.relationship}>
                {t(`guardians.relationships.${guardian.relationship}`)}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {guardian.is_primary && (
                <Badge variant="success" size="sm" label={t('guardians.primary')} />
              )}
              <Ionicons
                name={expandedId === guardian.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={neutral[400]}
              />
            </View>
          </Pressable>

          {expandedId === guardian.id && (
            <View style={styles.details}>
              {guardian.guardian_phone && (
                <Text style={styles.contact}>{guardian.guardian_phone}</Text>
              )}
              {guardian.guardian_email && (
                <Text style={styles.contact}>{guardian.guardian_email}</Text>
              )}

              <NotificationPrefs guardianId={guardian.id} />

              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => onEdit(guardian)}
                  style={styles.actionBtn}
                  title={t('common.edit')}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => handleRemove(guardian.id, guardian.guardian_name)}
                  loading={removeLoading}
                  style={styles.actionBtn}
                  title={t('common.remove')}
                />
              </View>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

function NotificationPrefs({ guardianId }: { guardianId: string }) {
  const { t } = useTranslation();
  const { data: prefs = [] } = useGuardianNotificationPrefs(guardianId);
  const updatePref = useUpdateGuardianNotificationPref(guardianId);

  const isEnabled = (category: string) =>
    prefs.find((p) => p.category === category)?.enabled ?? true;

  return (
    <View style={styles.notifSection}>
      <Text style={styles.notifTitle}>{t('guardians.notifications')}</Text>
      {NOTIFICATION_CATEGORIES.map((category) => (
        <View key={category} style={styles.notifRow}>
          <Text style={styles.notifLabel}>{t(`guardians.notificationCategories.${category}`)}</Text>
          <Switch
            value={isEnabled(category)}
            onValueChange={(enabled) => updatePref.mutate({ category, enabled })}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.textStyles.bodyMedium, color: lightTheme.text },
  relationship: { ...typography.textStyles.caption, color: neutral[500], marginTop: spacing.xs },
  details: { marginTop: spacing.md, gap: spacing.sm },
  contact: { ...typography.textStyles.body, color: neutral[600] },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1 },
  empty: { ...typography.textStyles.body, color: neutral[400], textAlign: 'center', paddingVertical: spacing.lg },
  notifSection: { marginTop: spacing.sm, gap: spacing.xs },
  notifTitle: { ...typography.textStyles.caption, color: neutral[500] },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifLabel: { ...typography.textStyles.body, color: lightTheme.text },
});
