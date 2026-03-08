import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/Button';
import { StarRating } from './StarRating';
import { FeedbackTags } from './FeedbackTags';
import { useSubmitRating } from '../hooks/useSubmitRating';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

const ratingSchema = z.object({
  starRating: z.number().min(1).max(5),
  tags: z.array(z.string()),
  comment: z.string().max(500).nullable(),
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface RatingPromptProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RatingPrompt({ sessionId, isOpen, onClose, onSuccess }: RatingPromptProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '90%'], []);
  const submitRating = useSubmitRating();

  const { control, handleSubmit, watch, setValue, reset } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { starRating: 0, tags: [], comment: null },
  });

  const starRating = watch('starRating');
  const tags = watch('tags');
  const comment = watch('comment');

  const toggleTag = useCallback(
    (tagKey: string) => {
      const current = tags;
      if (current.includes(tagKey)) {
        setValue('tags', current.filter((t) => t !== tagKey));
      } else {
        setValue('tags', [...current, tagKey]);
      }
    },
    [tags, setValue],
  );

  const onSubmit = handleSubmit(async (data) => {
    await submitRating.mutateAsync({
      sessionId,
      starRating: data.starRating,
      tags: data.tags,
      comment: data.comment || null,
    });
    reset();
    onClose();
    onSuccess?.();
  });

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('ratings.rateSession')}</Text>
        <Text style={styles.subtitle}>{t('ratings.ratePrompt')}</Text>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          <Controller
            control={control}
            name="starRating"
            render={({ field: { onChange, value } }) => (
              <StarRating value={value} onChange={onChange} />
            )}
          />
        </View>

        {/* Feedback Tags */}
        {starRating > 0 && (
          <FeedbackTags
            selectedTags={tags}
            onToggleTag={toggleTag}
            starRating={starRating}
          />
        )}

        {/* Comment */}
        {starRating > 0 && (
          <View style={styles.commentSection}>
            <Controller
              control={control}
              name="comment"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.commentInput}
                  placeholder={t('ratings.commentPlaceholder')}
                  placeholderTextColor={colors.neutral[400]}
                  value={value ?? ''}
                  onChangeText={(text) => onChange(text || null)}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              )}
            />
            <Text style={styles.charCount}>
              {t('ratings.commentCharLimit', { count: (comment ?? '').length })}
            </Text>
          </View>
        )}

        {/* Submit */}
        <Button
          title={submitRating.isPending ? t('ratings.submitting') : t('ratings.submit')}
          onPress={onSubmit}
          disabled={starRating === 0 || submitRating.isPending}
          style={styles.submitButton}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopStartRadius: normalize(20),
    borderTopEndRadius: normalize(20),
  },
  indicator: {
    backgroundColor: colors.neutral[300],
    width: normalize(40),
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  starsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  commentSection: {
    gap: spacing.xs,
  },
  commentInput: {
    ...typography.textStyles.body,
    backgroundColor: colors.neutral[50],
    borderRadius: normalize(12),
    padding: spacing.md,
    minHeight: normalize(80),
    borderWidth: 1,
    borderColor: colors.neutral[200],
    color: lightTheme.text,
  },
  charCount: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    textAlign: 'end',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
