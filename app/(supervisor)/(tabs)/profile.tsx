import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SupervisorProfileScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  if (!profile) return null;

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Card variant="default" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar
              source={profile.avatar_url ?? undefined}
              name={profile.display_name ?? profile.full_name}
              size="lg"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {profile.display_name ?? profile.full_name}
              </Text>
              <Badge label={t('roles.supervisor')} variant="indigo" size="sm" />
            </View>
          </View>
        </Card>

        <Button
          title={t('auth.signOut')}
          onPress={signOut}
          variant="ghost"
          fullWidth
        />
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
  profileCard: {
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
});
