import { useState, useCallback, useEffect, useMemo } from 'react';

import type {
  CreateRecitationPlanInput,
  SelectionMode,
  RecitationPlanType,
} from '@/features/scheduling/types/recitation-plan.types';
/** Locally-defined homework item shape (gamification feature removed). */
interface HomeworkItem {
  assignmentId: string;
  rubNumber: number;
  juz: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedPlanItem {
  id: string;
  surah_number: number;
  from_ayah: number;
  to_ayah: number;
  recitation_type: RecitationPlanType;
  source: 'manual' | 'from_assignment';
  assignment_id: string | null;
  selection_mode: SelectionMode;
  rub_number?: number | null;
  juz_number?: number | null;
  hizb_number?: number | null;
  end_surah?: number;
  end_ayah?: number;
}

interface ToggleableAssignment {
  id: string;
  surah_number: number;
  from_ayah: number;
  to_ayah: number;
}

interface UseRecitationPlanFormStateOptions {
  visible: boolean;
  initialItems?: SelectedPlanItem[];
  initialNotes?: string;
  hwAssignments: ToggleableAssignment[] | undefined;
  schoolId: string;
  sessionId: string;
  studentId: string | null | undefined;
  userId: string;
  onSave: (inputs: CreateRecitationPlanInput[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRecitationPlanFormState(options: UseRecitationPlanFormStateOptions) {
  const {
    visible,
    initialItems,
    initialNotes,
    hwAssignments,
    schoolId,
    sessionId,
    studentId,
    userId,
    onSave,
  } = options;

  // ── Multi-item state ─────────────────────────────────────────────────
  const [selectedItems, setSelectedItems] = useState<SelectedPlanItem[]>([]);
  const [notes, setNotes] = useState('');

  // ── Custom range staging state ───────────────────────────────────────
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('ayah_range');
  const [surahNumber, setSurahNumber] = useState<number | null>(null);
  const [fromAyah, setFromAyah] = useState<number | null>(null);
  const [toAyah, setToAyah] = useState<number | null>(null);
  const [rubNumber, setRubNumber] = useState<number | null>(null);
  const [hizbNumber, setHizbNumber] = useState<number | null>(null);
  const [juzNumber, setJuzNumber] = useState<number | null>(null);
  const [resolvedStart, setResolvedStart] = useState<{ surah: number; ayah: number } | null>(null);
  const [resolvedEnd, setResolvedEnd] = useState<{ surah: number; ayah: number } | null>(null);

  // ── Reset form when modal opens ─────────────────────────────────────
  const resetCustomRange = useCallback(() => {
    setSelectionMode('ayah_range');
    setSurahNumber(null);
    setFromAyah(null);
    setToAyah(null);
    setRubNumber(null);
    setHizbNumber(null);
    setJuzNumber(null);
    setResolvedStart(null);
    setResolvedEnd(null);
  }, []);

  useEffect(() => {
    if (visible) {
      setSelectedItems(initialItems ?? []);
      setNotes(initialNotes ?? '');
      setShowCustomRange(false);
      resetCustomRange();
    }
  }, [visible, initialItems, initialNotes]);

  // ── Item matching helpers ───────────────────────────────────────────
  const isMemorizationItemSelected = useCallback(
    (assignmentId: string) =>
      selectedItems.some((s) => s.assignment_id === assignmentId),
    [selectedItems],
  );

  const isHomeworkItemSelected = useCallback(
    (hw: HomeworkItem) =>
      selectedItems.some((s) => s.assignment_id === hw.assignmentId),
    [selectedItems],
  );

  // ── Handlers ────────────────────────────────────────────────────────
  const handleResolvedRange = useCallback(
    (range: { start_surah: number; start_ayah: number; end_surah: number; end_ayah: number }) => {
      setResolvedStart({ surah: range.start_surah, ayah: range.start_ayah });
      setResolvedEnd({ surah: range.end_surah, ayah: range.end_ayah });
    },
    [],
  );

  const handleSurahChange = useCallback((surah: number) => {
    setSurahNumber(surah);
    setFromAyah(null);
    setToAyah(null);
  }, []);

  const handleToggleMemorizationItem = useCallback(
    (assignment: ToggleableAssignment) => {
      setSelectedItems((prev) => {
        const existingIdx = prev.findIndex((s) => s.assignment_id === assignment.id);

        if (existingIdx >= 0) {
          return prev.filter((_, i) => i !== existingIdx);
        }

        return [
          ...prev,
          {
            id: makeItemId(),
            surah_number: assignment.surah_number,
            from_ayah: assignment.from_ayah,
            to_ayah: assignment.to_ayah,
            recitation_type: 'new_hifz' as RecitationPlanType,
            source: 'from_assignment' as const,
            assignment_id: assignment.id,
            selection_mode: 'ayah_range' as SelectionMode,
          },
        ];
      });
    },
    [],
  );

  const handleToggleHomeworkItem = useCallback(
    (hw: HomeworkItem) => {
      const assignment = (hwAssignments ?? []).find((a) => a.id === hw.assignmentId);
      if (!assignment) return;

      setSelectedItems((prev) => {
        const existingIdx = prev.findIndex((s) => s.assignment_id === hw.assignmentId);

        if (existingIdx >= 0) {
          return prev.filter((_, i) => i !== existingIdx);
        }

        return [
          ...prev,
          {
            id: makeItemId(),
            surah_number: assignment.surah_number,
            from_ayah: assignment.from_ayah,
            to_ayah: assignment.to_ayah,
            recitation_type: 'old_review' as RecitationPlanType,
            source: 'from_assignment' as const,
            assignment_id: assignment.id,
            selection_mode: 'ayah_range' as SelectionMode,
          },
        ];
      });
    },
    [hwAssignments],
  );

  const handleAddCustomRange = useCallback(() => {
    let itemSurah: number;
    let itemFromAyah: number;
    let itemEndSurah: number;
    let itemToAyah: number;
    const itemSelectionMode = selectionMode;
    const itemRub = rubNumber;
    const itemHizb = hizbNumber;
    const itemJuz = juzNumber;

    if (selectionMode === 'ayah_range') {
      if (surahNumber == null || fromAyah == null || toAyah == null) return;
      itemSurah = surahNumber;
      itemFromAyah = fromAyah;
      itemEndSurah = surahNumber;
      itemToAyah = toAyah;
    } else if (resolvedStart && resolvedEnd) {
      itemSurah = resolvedStart.surah;
      itemFromAyah = resolvedStart.ayah;
      itemEndSurah = resolvedEnd.surah;
      itemToAyah = resolvedEnd.ayah;
    } else {
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        id: makeItemId(),
        surah_number: itemSurah,
        from_ayah: itemFromAyah,
        to_ayah: itemToAyah,
        end_surah: itemEndSurah,
        end_ayah: itemToAyah,
        recitation_type: 'new_hifz' as RecitationPlanType,
        source: 'manual' as const,
        assignment_id: null,
        selection_mode: itemSelectionMode,
        rub_number: itemSelectionMode === 'rub' ? itemRub : null,
        hizb_number: itemSelectionMode === 'hizb' ? itemHizb : null,
        juz_number: itemSelectionMode === 'juz' ? itemJuz : null,
      },
    ]);

    resetCustomRange();
  }, [
    selectionMode,
    surahNumber,
    fromAyah,
    toAyah,
    resolvedStart,
    resolvedEnd,
    rubNumber,
    hizbNumber,
    juzNumber,
    resetCustomRange,
  ]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // ── Derived state ───────────────────────────────────────────────────
  const customRangeValid = useMemo(() => {
    if (selectionMode === 'ayah_range') {
      return surahNumber != null && fromAyah != null && toAyah != null;
    }
    if (selectionMode === 'rub') return rubNumber != null;
    if (selectionMode === 'hizb') return hizbNumber != null;
    if (selectionMode === 'juz') return juzNumber != null;
    if (selectionMode === 'surah') return surahNumber != null && resolvedStart != null && resolvedEnd != null;
    return false;
  }, [selectionMode, surahNumber, fromAyah, toAyah, rubNumber, hizbNumber, juzNumber, resolvedStart, resolvedEnd]);

  const isValid = selectedItems.length > 0;

  const handleSave = useCallback(() => {
    if (!isValid) return;

    const inputs: CreateRecitationPlanInput[] = selectedItems.map((item) => ({
      school_id: schoolId,
      scheduled_session_id: sessionId,
      student_id: studentId ?? null,
      set_by: userId,
      selection_mode: item.selection_mode,
      start_surah: item.surah_number,
      start_ayah: item.from_ayah,
      end_surah: item.end_surah ?? item.surah_number,
      end_ayah: item.end_ayah ?? item.to_ayah,
      rub_number: item.rub_number ?? null,
      juz_number: item.juz_number ?? null,
      hizb_number: item.hizb_number ?? null,
      recitation_type: item.recitation_type,
      source: item.source,
      assignment_id: item.source === 'from_assignment' ? item.assignment_id : null,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    }));

    onSave(inputs);
  }, [isValid, selectedItems, schoolId, sessionId, studentId, userId, notes, onSave]);

  return {
    // Multi-item state
    selectedItems,
    notes,
    setNotes,

    // Custom range
    showCustomRange,
    setShowCustomRange,
    selectionMode,
    setSelectionMode,
    surahNumber,
    fromAyah,
    toAyah,
    setFromAyah,
    setToAyah,
    rubNumber,
    hizbNumber,
    juzNumber,
    setRubNumber,
    setHizbNumber,
    setJuzNumber,
    handleSurahChange,
    handleResolvedRange,
    customRangeValid,
    handleAddCustomRange,

    // Item toggling
    isMemorizationItemSelected,
    isHomeworkItemSelected,
    handleToggleMemorizationItem,
    handleToggleHomeworkItem,
    handleRemoveItem,

    // Save
    isValid,
    handleSave,
  };
}
