import React, { useCallback } from 'react';
import { View, Text, Pressable, Linking, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ProfileSummary, PrayerTimeSlot } from '../types/himam.types';

interface PartnerCardProps {
  partner: ProfileSummary;
  myMeetingLink?: string | null;
  timeSlots?: PrayerTimeSlot[];
}

export function PartnerCard({ partner, myMeetingLink, timeSlots }: PartnerCardProps) {
  const { t } = useTranslation();

  const openLink = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('himam.partner.meetingLink'), url);
      }
    } catch {
      Alert.alert(t('himam.partner.meetingLink'), url);
    }
  }, [t]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={20} color={lightTheme.primary} />
        <Text style={styles.label}>{t('himam.partner.label')}</Text>
      </View>

      <Text style={styles.partnerName}>{partner.full_name}</Text>

      {timeSlots && timeSlots.length > 0 && (
        <View style={styles.slotsRow}>
          {timeSlots.map((slot) => (
            <View key={slot} style={styles.slotChip}>
              <Text style={styles.slotText}>{t(`himam.prayerTimes.${slot}`)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.linksSection}>
        {partner.meeting_link && (
          <Pressable
            style={styles.linkButton}
            onPress={() => openLink(partner.meeting_link!)}
          >
            <Ionicons name="videocam-outline" size={16} color={lightTheme.card} />
            <Text style={styles.linkButtonText}>
              {t('himam.partner.partnerMeetingLink')} - {t('himam.partner.joinMeeting')}
            </Text>
          </Pressable>
        )}

        {myMeetingLink && (
          <Pressable
            style={[styles.linkButton, styles.linkButtonSecondary]}
            onPress={() => openLink(myMeetingLink)}
          >
            <Ionicons name="link-outline" size={16} color={lightTheme.primary} />
            <Text style={[styles.linkButtonText, styles.linkButtonTextSecondary]}>
              {t('himam.partner.yourMeetingLink')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.card,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  partnerName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '600',
    fontSize: 18,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  slotChip: {
    backgroundColor: lightTheme.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  linksSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: lightTheme.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 8,
  },
  linkButtonSecondary: {
    backgroundColor: lightTheme.primary + '15',
  },
  linkButtonText: {
    ...typography.textStyles.body,
    color: lightTheme.card,
    fontWeight: '600',
  },
  linkButtonTextSecondary: {
    color: lightTheme.primary,
  },
});
