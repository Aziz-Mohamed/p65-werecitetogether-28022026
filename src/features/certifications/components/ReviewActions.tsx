import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type ReviewMode = 'supervisor' | 'program_admin';

interface ReviewActionsProps {
  mode: ReviewMode;
  onApprove: () => void;
  onReturn: (notes: string) => void;
  onReject?: (notes: string) => void;
  isLoading?: boolean;
}

export function ReviewActions({
  mode,
  onApprove,
  onReturn,
  onReject,
  isLoading,
}: ReviewActionsProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%'], []);
  const [notes, setNotes] = useState('');
  const [sheetAction, setSheetAction] = useState<'return' | 'reject' | null>(null);

  const openSheet = (action: 'return' | 'reject') => {
    setSheetAction(action);
    setNotes('');
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
    setSheetAction(null);
    setNotes('');
  };

  const handleConfirm = () => {
    if (!notes.trim()) return;
    if (sheetAction === 'return') {
      onReturn(notes.trim());
    } else if (sheetAction === 'reject' && onReject) {
      onReject(notes.trim());
    }
    closeSheet();
  };

  return (
    <>
      <View style={styles.actions}>
        <Button
          title={mode === 'supervisor'
            ? t('certifications.review.approve')
            : t('certifications.review.issue')}
          onPress={onApprove}
          variant="primary"
          loading={isLoading}
        />
        <Button
          title={t('certifications.review.return')}
          onPress={() => openSheet('return')}
          variant="secondary"
        />
        {mode === 'program_admin' && onReject && (
          <Button
            title={t('certifications.review.reject')}
            onPress={() => openSheet('reject')}
            variant="danger"
          />
        )}
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setSheetAction(null)}
        index={-1}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>
            {sheetAction === 'return'
              ? t('certifications.review.returnTitle')
              : t('certifications.review.rejectTitle')}
          </Text>
          <Text style={styles.sheetDescription}>
            {sheetAction === 'return'
              ? t('certifications.review.returnDescription')
              : t('certifications.review.rejectDescription')}
          </Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder={t('certifications.review.notesPlaceholder')}
            placeholderTextColor={lightTheme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
          <View style={styles.sheetActions}>
            <Button
              title={t('common.cancel')}
              onPress={closeSheet}
              variant="ghost"
            />
            <Button
              title={t('common.confirm')}
              onPress={handleConfirm}
              variant={sheetAction === 'reject' ? 'danger' : 'primary'}
              loading={isLoading}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sheetContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  sheetTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBottom: spacing.xs,
  },
  sheetDescription: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBottom: spacing.base,
  },
  notesInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.base,
    minHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
});
