import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CurriculumProgress, ProgressType, UpdateSectionInput } from '../types/curriculum-progress.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const MUTOON_STATUSES = ['not_started', 'in_progress', 'memorized', 'certified'] as const;
const QIRAAT_STATUSES = ['not_started', 'passed', 'failed'] as const;
const ARABIC_STATUSES = ['not_started', 'in_progress', 'passed', 'failed'] as const;

interface SectionUpdateFormProps {
  section: CurriculumProgress;
  progressType: ProgressType;
  onSubmit: (input: UpdateSectionInput) => void;
  loading?: boolean;
}

export function SectionUpdateForm({ section, progressType, onSubmit, loading }: SectionUpdateFormProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(section.status);
  const [score, setScore] = useState(section.score?.toString() ?? '');
  const [notes, setNotes] = useState('');

  const statuses = progressType === 'qiraat'
    ? QIRAAT_STATUSES
    : progressType === 'arabic'
    ? ARABIC_STATUSES
    : MUTOON_STATUSES;

  const showScore = progressType !== 'qiraat';
  const scoreLabel = progressType === 'arabic'
    ? t('curriculumProgress.scoring.arabic')
    : t('curriculumProgress.scoring.mutoon');

  const handleSubmit = () => {
    const input: UpdateSectionInput = {
      status,
      teacher_notes: notes || undefined,
    };

    if (showScore && score) {
      const numScore = Number(score);
      if (progressType === 'arabic') {
        input.score = Math.max(0, Math.min(100, numScore));
        // Auto-set status based on passing threshold
        if (numScore >= 60 && status === 'in_progress') {
          input.status = 'passed';
        }
      } else {
        input.score = Math.max(0, Math.min(5, numScore));
      }
    }

    onSubmit(input);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {section.section_number}. {section.section_title}
      </Text>

      <Text style={styles.label}>{t('curriculumProgress.status.label')}</Text>
      <View style={styles.statusRow}>
        {statuses.map((s) => (
          <Pressable key={s} onPress={() => setStatus(s)}>
            <Badge
              variant={status === s ? 'success' : 'default'}
              size="sm"
              label={t(`curriculumProgress.status.${s}`)}
            />
          </Pressable>
        ))}
      </View>

      {showScore && (
        <>
          <Text style={styles.label}>{scoreLabel}</Text>
          <TextInput
            style={styles.input}
            value={score}
            onChangeText={setScore}
            placeholder={progressType === 'arabic' ? '0-100' : '0-5'}
            placeholderTextColor={neutral[400]}
            keyboardType="numeric"
          />
        </>
      )}

      <Text style={styles.label}>{t('curriculumProgress.notes')}</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('curriculumProgress.notesPlaceholder')}
        placeholderTextColor={neutral[400]}
        multiline
      />

      <Button
        variant="primary"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
        title={t('common.save')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  sectionTitle: { ...typography.textStyles.bodyMedium, color: lightTheme.text },
  label: { ...typography.textStyles.caption, color: neutral[500], marginTop: spacing.xs },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  input: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },
  submitButton: { marginTop: spacing.sm },
});
