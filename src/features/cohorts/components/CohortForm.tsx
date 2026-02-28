import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { useCreateCohort } from '../hooks/useCohorts';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import type { CreateCohortInput } from '../types';

interface CohortFormProps {
  programId: string;
  onDismiss: () => void;
  visible: boolean;
}

export function CohortForm({ programId, onDismiss, visible }: CohortFormProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%'], []);
  const createCohort = useCreateCohort();

  const [name, setName] = React.useState('');
  const [maxStudents, setMaxStudents] = React.useState('25');
  const [meetingLink, setMeetingLink] = React.useState('');

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;

    const input: CreateCohortInput = {
      programId,
      name: name.trim(),
      maxStudents: parseInt(maxStudents, 10) || 25,
      meetingLink: meetingLink.trim() || undefined,
    };

    await createCohort.mutateAsync(input);
    setName('');
    setMaxStudents('25');
    setMeetingLink('');
    onDismiss();
  }, [name, maxStudents, meetingLink, programId, createCohort, onDismiss]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t('cohorts.create')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cohorts.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('cohorts.namePlaceholder')}
            placeholderTextColor={neutral[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cohorts.maxStudents')}</Text>
          <TextInput
            style={styles.input}
            value={maxStudents}
            onChangeText={setMaxStudents}
            keyboardType="numeric"
            placeholderTextColor={neutral[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cohorts.meetingLink')}</Text>
          <TextInput
            style={styles.input}
            value={meetingLink}
            onChangeText={setMeetingLink}
            placeholder="https://..."
            placeholderTextColor={neutral[400]}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <Button
          title={t('cohorts.create')}
          onPress={handleSubmit}
          variant="primary"
          loading={createCohort.isPending}
          disabled={!name.trim()}
          fullWidth
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockEnd: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.textStyles.label,
    color: neutral[600],
  },
  input: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: lightTheme.surfaceElevated,
    height: normalize(44),
  },
});
