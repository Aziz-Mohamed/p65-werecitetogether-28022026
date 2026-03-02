import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function TeamScreen() {
  const { t } = useTranslation();

  // TODO: Get programId from context/store and use useRolesForProgram(programId)

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('dashboard.programAdmin.team')}</Text>

        <View style={styles.actionsRow}>
          <Button
            title={t('common.assign')}
            onPress={() => {
              // TODO: Open assign teacher/supervisor sheet
            }}
            variant="primary"
            size="sm"
          />
        </View>

        {/* Placeholder */}
        <View style={styles.placeholder}>
          <Ionicons name="people-outline" size={48} color={neutral[300]} />
          <Text style={styles.placeholderText}>{t('common.comingSoon')}</Text>
        </View>
      </View>
    </Screen>
  );
}

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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBlock: spacing['3xl'],
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
