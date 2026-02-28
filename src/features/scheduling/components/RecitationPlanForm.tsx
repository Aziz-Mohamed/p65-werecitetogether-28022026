import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { shadows } from '@/theme/shadows';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { QuranRangePicker } from '@/features/memorization/components/QuranRangePicker';
import { assignmentService } from '@/features/memorization/services/assignment.service';
// useRevisionHomework removed with gamification feature — stub below
import { useAllRubReferences, findRubForAyah } from '@/features/scheduling/hooks/useQuranRubReference';
import { getSurah } from '@/lib/quran-metadata';
import type { Tables } from '@/types/database.types';
import type { CreateRecitationPlanInput } from '@/features/scheduling/types/recitation-plan.types';
import {
  useRecitationPlanFormState,
  type SelectedPlanItem,
} from '@/features/scheduling/hooks/useRecitationPlanFormState';
import { useUIStore } from '@/stores/uiStore';
import { PlanSuggestionItem } from './PlanSuggestionItem';

export type { SelectedPlanItem };

type RubReference = Tables<'quran_rub_reference'>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecitationPlanFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (inputs: CreateRecitationPlanInput[]) => void;
  sessionId: string;
  studentId?: string | null;
  schoolId: string;
  userId: string;
  sessionDate: string;
  initialItems?: SelectedPlanItem[];
  initialNotes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRubContext(
  rubData: RubReference[],
  surah: number,
  ayah: number,
  t: (key: string) => string,
): string | null {
  const info = findRubForAyah(rubData, surah, ayah);
  if (!info) return null;
  return `${t('gamification.rub')} ${info.rub_number} · ${t('gamification.juz')} ${info.juz_number}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecitationPlanForm({
  visible,
  onClose,
  onSave,
  sessionId,
  studentId,
  schoolId,
  userId,
  sessionDate,
  initialItems,
  initialNotes,
}: RecitationPlanFormProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // ── Hide tab bar while modal is open ────────────────────────────────
  const pushModal = useUIStore((s) => s.pushModal);
  const popModal = useUIStore((s) => s.popModal);

  useEffect(() => {
    if (visible) {
      pushModal();
      return () => popModal();
    }
  }, [visible, pushModal, popModal]);

  // ── Data sources ────────────────────────────────────────────────────
  const { data: memorizationAssignments = [], isLoading: loadingMemo } = useQuery({
    queryKey: ['assignments', 'pending-new-hifz', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await assignmentService.getAssignments({
        studentId,
        assignmentType: 'new_hifz',
        status: 'pending',
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studentId,
    staleTime: 1000 * 60,
  });

  // Gamification feature removed — homework items stubbed as empty
  const homeworkItems: { assignmentId: string; rubNumber: number; juz: number }[] = [];
  const hwAssignments: { id: string; surah_number: number; from_ayah: number; to_ayah: number }[] | undefined = undefined;
  const loadingHomework = false;

  const { data: rubData = [] } = useAllRubReferences();

  // ── Form state (hook) ──────────────────────────────────────────────
  const form = useRecitationPlanFormState({
    visible,
    initialItems,
    initialNotes,
    hwAssignments,
    schoolId,
    sessionId,
    studentId,
    userId,
    onSave,
  });

  // ── Render helpers ────────────────────────────────────────────────
  const renderItemLabel = useCallback(
    (surah: number, fromA: number, toA: number) => {
      const surahData = getSurah(surah);
      const name = isArabic
        ? (surahData?.nameArabic ?? surahData?.nameEnglish ?? String(surah))
        : (surahData?.nameEnglish ?? String(surah));
      return `${name} ${fromA}–${toA}`;
    },
    [isArabic],
  );

  const renderRubContext = useCallback(
    (surah: number, ayah: number) => {
      if (rubData.length === 0) return null;
      return formatRubContext(rubData, surah, ayah, t);
    },
    [rubData, t],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialItems != null && initialItems.length > 0
                ? t('scheduling.recitationPlan.editPlan')
                : t('scheduling.recitationPlan.setPlan')}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
              <Ionicons
                name="close"
                size={normalize(24)}
                color={lightTheme.textSecondary}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Selected Items Cart ── */}
            {form.selectedItems.length > 0 && (
              <View style={styles.cartSection}>
                <Text style={styles.cartTitle}>
                  {t('scheduling.recitationPlan.selectedCount', { count: form.selectedItems.length })}
                </Text>
                {form.selectedItems.map((item) => {
                  const label = renderItemLabel(item.surah_number, item.from_ayah, item.to_ayah);
                  const rubCtx = renderRubContext(item.surah_number, item.from_ayah);
                  return (
                    <View key={item.id} style={styles.cartItem}>
                      <View style={styles.cartItemContent}>
                        <Text style={styles.cartItemLabel} numberOfLines={1}>
                          {label}
                        </Text>
                        {rubCtx && (
                          <Text style={styles.rubContext}>{rubCtx}</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => form.handleRemoveItem(item.id)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.remove')}
                      >
                        <Ionicons name="close-circle" size={normalize(20)} color={colors.semantic.error} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Memorization Section ── */}
            {studentId != null && (
              <View style={styles.dataSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="book-outline" size={normalize(16)} color={colors.primary[600]} />
                  <Text style={styles.sectionTitle}>
                    {t('scheduling.recitationPlan.memorizationSection')}
                  </Text>
                </View>

                {loadingMemo ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} style={styles.loader} />
                ) : memorizationAssignments.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t('scheduling.recitationPlan.noProgress')}
                  </Text>
                ) : (
                  <FlatList
                    data={memorizationAssignments}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <PlanSuggestionItem
                        label={renderItemLabel(item.surah_number, item.from_ayah, item.to_ayah)}
                        rubContext={renderRubContext(item.surah_number, item.from_ayah)}
                        selected={form.isMemorizationItemSelected(item.id)}
                        onToggle={() => form.handleToggleMemorizationItem(item)}
                      />
                    )}
                  />
                )}
              </View>
            )}

            {/* ── Revision Section ── */}
            {studentId != null && (
              <View style={styles.dataSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="refresh-outline" size={normalize(16)} color={colors.accent.sky[600]} />
                  <Text style={styles.sectionTitle}>
                    {t('scheduling.recitationPlan.revisionSection')}
                  </Text>
                </View>

                {loadingHomework ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} style={styles.loader} />
                ) : homeworkItems.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t('scheduling.recitationPlan.noHomework')}
                  </Text>
                ) : (
                  <FlatList
                    data={homeworkItems}
                    keyExtractor={(item) => item.assignmentId}
                    scrollEnabled={false}
                    renderItem={({ item: hw }) => {
                      const assignment = (hwAssignments ?? []).find(
                        (a) => a.id === hw.assignmentId,
                      );
                      const surah = assignment ? getSurah(assignment.surah_number) : null;
                      const surahName = surah
                        ? (isArabic ? (surah.nameArabic ?? surah.nameEnglish) : surah.nameEnglish)
                        : null;
                      const label = surahName
                        ? `${surahName} ${assignment!.from_ayah}–${assignment!.to_ayah}`
                        : `${t('gamification.rub')} ${hw.rubNumber}`;
                      const rubCtx = assignment
                        ? renderRubContext(assignment.surah_number, assignment.from_ayah)
                        : null;
                      return (
                        <PlanSuggestionItem
                          label={label}
                          rubContext={rubCtx}
                          selected={form.isHomeworkItemSelected(hw)}
                          onToggle={() => form.handleToggleHomeworkItem(hw)}
                          trailing={
                            <Badge
                              label={`${t('gamification.rub')} ${hw.rubNumber}`}
                              variant="sky"
                              size="sm"
                            />
                          }
                        />
                      );
                    }}
                  />
                )}
              </View>
            )}

            {/* ── Custom Range (foldable) ── */}
            <Pressable
              onPress={() => form.setShowCustomRange((prev: boolean) => !prev)}
              style={styles.customRangeToggle}
              accessibilityRole="button"
            >
              <Ionicons
                name="create-outline"
                size={normalize(18)}
                color={colors.neutral[600]}
              />
              <Text style={styles.customRangeText}>
                {t('scheduling.recitationPlan.customRange')}
              </Text>
              <Ionicons
                name={form.showCustomRange ? 'chevron-up' : 'chevron-down'}
                size={normalize(18)}
                color={lightTheme.textTertiary}
              />
            </Pressable>

            {form.showCustomRange && (
              <View style={styles.customRangeContent}>
                <QuranRangePicker
                  selectionMode={form.selectionMode}
                  onChangeSelectionMode={form.setSelectionMode}
                  surahNumber={form.surahNumber}
                  fromAyah={form.fromAyah}
                  toAyah={form.toAyah}
                  onChangeSurah={form.handleSurahChange}
                  onChangeFromAyah={form.setFromAyah}
                  onChangeToAyah={form.setToAyah}
                  rubNumber={form.rubNumber}
                  hizbNumber={form.hizbNumber}
                  juzNumber={form.juzNumber}
                  onChangeRub={form.setRubNumber}
                  onChangeHizb={form.setHizbNumber}
                  onChangeJuz={form.setJuzNumber}
                  onResolvedRange={form.handleResolvedRange}
                />

                {/* Rub context for staged custom range */}
                {form.selectionMode === 'ayah_range' && form.surahNumber != null && form.fromAyah != null && (
                  <Text style={styles.rubContextStaged}>
                    {renderRubContext(form.surahNumber, form.fromAyah) ?? ''}
                  </Text>
                )}

                <Button
                  title={t('scheduling.recitationPlan.addCustomRange')}
                  onPress={form.handleAddCustomRange}
                  variant="secondary"
                  size="sm"
                  disabled={!form.customRangeValid}
                  icon={
                    <Ionicons
                      name="add-circle-outline"
                      size={normalize(16)}
                      color={form.customRangeValid ? colors.primary[600] : colors.neutral[400]}
                    />
                  }
                  style={styles.addButton}
                />
              </View>
            )}

            {/* Notes */}
            <TextField
              label={t('common.notes')}
              placeholder=""
              value={form.notes}
              onChangeText={form.setNotes}
              multiline
              style={styles.section}
            />

            {/* Footer buttons */}
            <View style={styles.footer}>
              <Button
                title={t('common.cancel')}
                onPress={onClose}
                variant="ghost"
                size="md"
                style={styles.footerButton}
              />
              <Button
                title={
                  form.selectedItems.length > 0
                    ? `${t('common.save')} (${form.selectedItems.length})`
                    : t('common.save')
                }
                onPress={form.handleSave}
                variant="primary"
                size="md"
                disabled={!form.isValid}
                style={styles.footerButton}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: lightTheme.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    color: lightTheme.text,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  section: {
    marginTop: spacing.xs,
  },
  // ── Cart ──
  cartSection: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: spacing.xs,
  },
  cartTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    color: colors.primary[700],
    paddingHorizontal: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
  },
  cartItemContent: {
    flex: 1,
    marginEnd: spacing.sm,
  },
  cartItemLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.primary[700],
  },
  rubContext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    color: lightTheme.textTertiary,
    marginTop: normalize(1),
  },
  // ── Data sections ──
  dataSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: lightTheme.text,
  },
  loader: {
    paddingVertical: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: lightTheme.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  rubContextStaged: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    color: lightTheme.textTertiary,
    paddingHorizontal: spacing.sm,
  },
  // ── Custom range ──
  customRangeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  customRangeText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.neutral[700],
  },
  customRangeContent: {
    gap: spacing.sm,
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  // ── Footer ──
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: lightTheme.border,
  },
  footerButton: {
    flex: 1,
  },
});
