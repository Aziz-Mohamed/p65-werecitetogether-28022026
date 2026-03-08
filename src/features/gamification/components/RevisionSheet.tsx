import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { EnrichedCertification, RubReference } from '../types/gamification.types';
import { FRESHNESS_BG_COLORS, FRESHNESS_DOT_COLORS } from '../utils/freshness-colors';
import { colors } from '@/theme/colors';
import { formatRubVerseRange, getMushafPage } from '@/lib/quran-metadata';
import i18next from 'i18next';
import { styles } from './RevisionSheet.styles';

type RevisionAction = 'good' | 'poor' | 'recertify';

interface RevisionSheetBaseProps {
  visible: boolean;
  certification: EnrichedCertification | null;
  reference?: RubReference | null;
  onClose: () => void;
}

interface TeacherRevisionSheetProps extends RevisionSheetBaseProps {
  mode: 'teacher';
  onAction: (action: RevisionAction) => void;
}

interface StudentRevisionSheetProps extends RevisionSheetBaseProps {
  mode: 'student';
  canSelfAssign: boolean;
  alreadyInPlan: boolean;
  isAddingToPlan?: boolean;
  onAddToPlan: () => void;
}

export type RevisionSheetProps = TeacherRevisionSheetProps | StudentRevisionSheetProps;

/**
 * Revision modal for certified rubʿ.
 *
 * Student mode: shows info section + "Add to Plan" action
 * Teacher mode: shows info section + Good/Poor/Recertify actions
 */
export function RevisionSheet(props: RevisionSheetProps) {
  const { visible, certification, reference, onClose, mode } = props;
  const { t } = useTranslation();

  if (!certification) return null;

  const isDormant = certification.freshness.state === 'dormant';
  const dormantDays = certification.dormant_since
    ? (Date.now() - Date.parse(certification.dormant_since)) / (24 * 60 * 60 * 1000)
    : 0;
  const needsRecertification = isDormant && dormantDays >= 90;

  const juz = Math.ceil(certification.rub_number / 8);
  const mushafPage = getMushafPage(certification.rub_number);
  const lang = i18next.language?.startsWith('ar') ? 'ar' : 'en';

  // Verse range from reference data
  const verseRange = reference
    ? formatRubVerseRange(
        reference.start_surah,
        reference.start_ayah,
        reference.end_surah,
        reference.end_ayah,
        lang,
      )
    : null;

  // Teacher name from joined profile
  const teacherName = certification.profiles?.full_name ?? null;

  // Relative time for last review
  const lastReviewedText = certification.last_reviewed_at
    ? t('gamification.revision.daysAgo', {
        count: Math.floor(
          (Date.now() - Date.parse(certification.last_reviewed_at)) / (24 * 60 * 60 * 1000),
        ),
      })
    : t('gamification.revision.neverReviewed');

  // Certified date formatted
  const certifiedDate = certification.certified_at
    ? new Date(certification.certified_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                {t('gamification.rub')} {certification.rub_number} {'\u00B7'}{' '}
                {t('gamification.juz')} {juz}
              </Text>
              {verseRange && <Text style={styles.verseRange}>{verseRange}</Text>}
            </View>
            <View
              style={[
                styles.freshnessChip,
                { backgroundColor: FRESHNESS_BG_COLORS[certification.freshness.state] },
              ]}
            >
              <Text style={styles.freshnessText}>
                {t(`gamification.freshness.${certification.freshness.state}`)}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            {certifiedDate && (
              <InfoRow
                label={t('gamification.revision.certifiedOn')}
                value={certifiedDate}
              />
            )}
            {teacherName && (
              <InfoRow
                label={t('gamification.revision.certifiedBy')}
                value={teacherName}
              />
            )}
            {mushafPage != null && (
              <InfoRow
                label={t('gamification.revision.mushafPage')}
                value={`${mushafPage}`}
              />
            )}
            <InfoRow
              label={t('gamification.revision.timesReviewed')}
              value={`${certification.review_count} ${certification.review_count === 1 ? 'time' : 'times'}`}
            />
            <InfoRow
              label={t('gamification.revision.lastReviewed')}
              value={lastReviewedText}
            />
            {/* Freshness bar */}
            <View style={styles.freshnessBarRow}>
              <View style={styles.freshnessBarTrack}>
                <View
                  style={[
                    styles.freshnessBarFill,
                    {
                      width: `${certification.freshness.percentage}%`,
                      backgroundColor:
                        FRESHNESS_DOT_COLORS[certification.freshness.state] ?? colors.neutral[300],
                    },
                  ]}
                />
              </View>
              <Text style={styles.freshnessPercent}>
                {certification.freshness.percentage}%
              </Text>
            </View>
          </View>

          {/* Actions — differ by mode */}
          {mode === 'student' ? (
            <StudentActions
              needsRecertification={needsRecertification}
              canSelfAssign={props.canSelfAssign}
              alreadyInPlan={props.alreadyInPlan}
              isAddingToPlan={props.isAddingToPlan}
              onAddToPlan={props.onAddToPlan}
              t={t}
            />
          ) : (
            <TeacherActions
              isDormant={isDormant}
              needsRecertification={needsRecertification}
              onAction={props.onAction}
              t={t}
            />
          )}

          {/* Cancel */}
          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StudentActions({
  needsRecertification,
  canSelfAssign,
  alreadyInPlan,
  isAddingToPlan,
  onAddToPlan,
  t,
}: {
  needsRecertification: boolean;
  canSelfAssign: boolean;
  alreadyInPlan: boolean;
  isAddingToPlan?: boolean;
  onAddToPlan: () => void;
  t: (key: string) => string;
}) {
  if (needsRecertification) {
    return (
      <View style={styles.actions}>
        <View style={styles.infoMessage}>
          <Ionicons name="information-circle" size={20} color={colors.neutral[500]} />
          <Text style={styles.infoMessageText}>
            {t('gamification.revision.needsRecertNote')}
          </Text>
        </View>
      </View>
    );
  }

  if (!canSelfAssign) {
    return (
      <View style={styles.actions}>
        <View style={styles.infoMessage}>
          <Ionicons name="person" size={20} color={colors.neutral[500]} />
          <Text style={styles.infoMessageText}>
            {t('gamification.revision.askTeacherDesc')}
          </Text>
        </View>
      </View>
    );
  }

  if (alreadyInPlan) {
    return (
      <View style={styles.actions}>
        <View style={[styles.planButton, styles.planButtonDisabled]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary[500]} />
          <View style={styles.planButtonText}>
            <Text style={[styles.planButtonLabel, { color: colors.primary[600] }]}>
              {t('gamification.revision.alreadyInPlan')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      <Pressable
        style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}
        onPress={onAddToPlan}
        disabled={isAddingToPlan}
        accessibilityRole="button"
      >
        {isAddingToPlan ? (
          <ActivityIndicator size="small" color={colors.primary[500]} />
        ) : (
          <Ionicons name="book-outline" size={22} color={colors.primary[500]} />
        )}
        <View style={styles.planButtonText}>
          <Text style={[styles.planButtonLabel, { color: colors.primary[600] }]}>
            {t('gamification.revision.addToPlan')}
          </Text>
          <Text style={styles.planButtonDesc}>
            {t('gamification.revision.addToPlanDesc')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function TeacherActions({
  isDormant,
  needsRecertification,
  onAction,
  t,
}: {
  isDormant: boolean;
  needsRecertification: boolean;
  onAction: (action: RevisionAction) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.actions}>
      {needsRecertification ? (
        <ActionButton
          icon="refresh-circle"
          label={t('gamification.revision.recertify')}
          description={t('gamification.revision.recertifyDesc')}
          color={colors.accent.violet[500]}
          onPress={() => onAction('recertify')}
        />
      ) : (
        <>
          <ActionButton
            icon="checkmark-circle"
            label={t('gamification.revision.good')}
            description={t('gamification.revision.goodDesc')}
            color={colors.primary[500]}
            onPress={() => onAction('good')}
          />
          {!isDormant && (
            <ActionButton
              icon="alert-circle"
              label={t('gamification.revision.poor')}
              description={t('gamification.revision.poorDesc')}
              color={colors.secondary[500]}
              onPress={() => onAction('poor')}
            />
          )}
        </>
      )}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  description,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={24} color={color} />
      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
        <Text style={styles.actionDesc}>{description}</Text>
      </View>
    </Pressable>
  );
}

