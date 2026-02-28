import React, { useState, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { useSubmitReview } from '../hooks/useTeacherRatings';
import { POSITIVE_TAGS, CONSTRUCTIVE_TAGS } from '../types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface RatingPromptProps {
  sessionId: string;
  teacherId: string;
  studentId: string;
  programId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function RatingPrompt({
  sessionId,
  teacherId,
  studentId,
  programId,
  visible,
  onDismiss,
}: RatingPromptProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;

    await submitReview.mutateAsync({
      sessionId,
      teacherId,
      studentId,
      programId,
      rating,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      comment: comment.trim() || undefined,
    });

    setRating(0);
    setSelectedTags([]);
    setComment('');
    onDismiss();
  }, [rating, selectedTags, comment, sessionId, teacherId, studentId, programId, submitReview, onDismiss]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t('ratings.rateTeacher')}</Text>

        {/* Star Rating */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              accessibilityLabel={`${star} ${t('ratings.stars')}`}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? accent.yellow?.[500] ?? primary[500] : neutral[300]}
              />
            </Pressable>
          ))}
        </View>

        {/* Positive Tags */}
        <Text style={styles.tagSectionTitle}>{t('ratings.positiveTags')}</Text>
        <View style={styles.tagsRow}>
          {POSITIVE_TAGS.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[
                styles.tagChip,
                selectedTags.includes(tag) && styles.tagChipActive,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.tagTextActive,
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Constructive Tags */}
        <Text style={styles.tagSectionTitle}>{t('ratings.constructiveTags')}</Text>
        <View style={styles.tagsRow}>
          {CONSTRUCTIVE_TAGS.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[
                styles.tagChip,
                selectedTags.includes(tag) && styles.tagChipActiveConstructive,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.tagTextActive,
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Comment */}
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={t('ratings.commentPlaceholder')}
          placeholderTextColor={neutral[400]}
          multiline
          maxLength={500}
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Button
          title={t('ratings.submit')}
          onPress={handleSubmit}
          variant="primary"
          loading={submitReview.isPending}
          disabled={rating === 0}
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
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBlock: spacing.sm,
  },
  tagSectionTitle: {
    ...typography.textStyles.label,
    color: neutral[500],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: neutral[200],
    backgroundColor: lightTheme.surfaceElevated,
  },
  tagChipActive: {
    backgroundColor: primary[100],
    borderColor: primary[300],
  },
  tagChipActiveConstructive: {
    backgroundColor: accent.red[50],
    borderColor: accent.red[200],
  },
  tagText: {
    ...typography.textStyles.caption,
    color: neutral[600],
  },
  tagTextActive: {
    color: primary[700],
  },
  commentInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: normalize(70),
    backgroundColor: lightTheme.surfaceElevated,
  },
});
