import React from 'react';
import { StyleSheet, View, Text, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface PartnerCardProps {
  partnerName: string;
  avatarUrl?: string | null;
  meetingLink?: string | null;
  status: string;
}

export function PartnerCard({ partnerName, meetingLink, status }: PartnerCardProps) {
  const { t } = useTranslation();

  const handleOpenMeeting = () => {
    if (meetingLink) {
      Linking.openURL(meetingLink);
    }
  };

  return (
    <Card variant="default">
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={neutral[400]} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{partnerName}</Text>
          <Badge
            variant={status === 'paired' || status === 'in_progress' ? 'success' : 'default'}
            size="sm"
            label={t(`himam.registration.${status}`)}
          />
        </View>
      </View>

      {meetingLink ? (
        <Button
          variant="secondary"
          size="sm"
          onPress={handleOpenMeeting}
          icon={<Ionicons name="videocam-outline" size={20} color={lightTheme.primary} />}
          style={styles.meetingButton}
          title={t('himam.partner.meetingLink')}
        />
      ) : (
        <Text style={styles.noLink}>{t('common.noMeetingLink')}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  meetingButton: {
    marginTop: spacing.sm,
  },
  noLink: {
    ...typography.textStyles.caption,
    color: neutral[400],
    marginTop: spacing.sm,
  },
});
