import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { SessionWithDetails } from '../types';

interface PostSessionPromptProps {
  session: SessionWithDetails;
  studentId: string;
  onDismiss: () => void;
}

export function PostSessionPrompt({
  session,
  studentId,
  onDismiss,
}: PostSessionPromptProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('teacher_reviews').insert({
        session_id: session.id,
        teacher_id: session.teacher_id,
        student_id: studentId,
        program_id: session.program_id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      Alert.alert(t('postSession.thankYou'));
      onDismiss();
    },
    onError: (err) => {
      Alert.alert(
        t('common.error'),
        err instanceof Error ? err.message : t('common.unknownError'),
      );
    },
  });

  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    submitReview.mutate();
  }, [rating, submitReview]);

  const teacherProfile = session.teacher_profile;
  const displayName =
    teacherProfile?.display_name ?? teacherProfile?.full_name ?? '';
  const platform = teacherProfile?.meeting_platform ?? '';

  const durationMinutes = session.duration_minutes
    ?? Math.round((Date.now() - new Date(session.created_at).getTime()) / 60_000);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={primary[600]} />
        <Text style={styles.title}>{t('postSession.howWasSession')}</Text>
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityLabel={t('postSession.dismiss')}
          accessibilityRole="button"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color={neutral[400]} />
        </Pressable>
      </View>

      <View style={styles.teacherRow}>
        <Avatar
          source={teacherProfile?.avatar_url ?? undefined}
          name={displayName}
          size="md"
        />
        <View style={styles.teacherInfo}>
          <Text style={styles.sessionWith}>
            {t('postSession.sessionWith')}
          </Text>
          <Text style={styles.teacherName}>{displayName}</Text>
          {platform ? (
            <Text style={styles.metaText}>
              {platform.replaceAll('_', ' ')}
            </Text>
          ) : null}
          <Text style={styles.metaText}>
            {t('postSession.duration', { minutes: durationMinutes })}
          </Text>
        </View>
      </View>

      <View style={styles.starsRow}>
        <Text style={styles.rateLabel}>{t('postSession.rateTeacher')}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
              accessibilityRole="button"
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={28}
                color={star <= rating ? primary[500] : neutral[300]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.commentInput}
        placeholder={t('postSession.comment')}
        placeholderTextColor={neutral[400]}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={2}
        maxLength={500}
      />

      <View style={styles.actions}>
        <Button
          title={t('postSession.submitRating')}
          onPress={handleSubmit}
          variant="primary"
          size="sm"
          fullWidth
          loading={submitReview.isPending}
          disabled={rating === 0}
          style={styles.submitButton}
        />
        <Button
          title={t('postSession.dismiss')}
          onPress={onDismiss}
          variant="ghost"
          size="sm"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
    gap: spacing.md,
    marginInline: spacing.base,
    marginBlockStart: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teacherInfo: {
    flex: 1,
    gap: 2,
  },
  sessionWith: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  teacherName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: neutral[400],
    textTransform: 'capitalize',
  },
  starsRow: {
    gap: spacing.xs,
  },
  rateLabel: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  starButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.sm,
    paddingBlock: spacing.sm,
    paddingInline: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  submitButton: {
    minHeight: 44,
  },
});
