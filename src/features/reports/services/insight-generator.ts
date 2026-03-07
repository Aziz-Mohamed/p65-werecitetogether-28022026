import type { TFunction } from 'i18next';
import type {
  InsightData,
  HealthStatus,
  HealthMetric,
  ClassAnalytics,
  StudentNeedingAttention,
  StudentQuickStatus,
  SchoolKPISummary,
  TeacherActivitySummary,
  SessionCompletionStat,
} from '../types/reports.types';
import {
  ATTENDANCE_THRESHOLDS,
  SCORE_THRESHOLDS,
  PUNCTUALITY_THRESHOLDS,
  SESSION_COMPLETION_THRESHOLDS,
  getHealthStatus,
  getTrendDirection,
  formatTrendLabel,
  getScoreLabel,
  worstStatus,
} from '../utils/thresholds';

// ─── Teacher Insights ───────────────────────────────────────────────────────

export function generateTeacherInsights(
  analytics: ClassAnalytics | undefined,
  previousAnalytics: ClassAnalytics | undefined | null,
  attentionStudents: StudentNeedingAttention[],
  stickersCount: number,
  previousStickersCount: number | null,
  studentStatuses: StudentQuickStatus[],
  t: TFunction,
): InsightData[] {
  if (!analytics) return [];

  const insights: InsightData[] = [];

  // Rule 1: Students declining
  const declining = attentionStudents.filter((s) => s.flagReason === 'declining');
  if (declining.length > 0) {
    const topStudent = declining[0];
    insights.push({
      id: 'declining-students',
      severity: 'warning',
      icon: 'trending-down',
      title: t('insights.studentsDecline', { count: declining.length }),
      description: t('insights.studentsDeclineDetail', {
        name: topStudent.fullName,
        from: topStudent.previousAvg.toFixed(1),
        to: topStudent.currentAvg.toFixed(1),
      }),
      actionRoute: '/(teacher)/students/needs-support',
    });
  }

  // Rule 2: Low-score students
  const lowScores = attentionStudents.filter((s) => s.flagReason === 'low_scores');
  if (lowScores.length > 0 && declining.length === 0) {
    insights.push({
      id: 'low-score-students',
      severity: 'warning',
      icon: 'alert-circle',
      title: t('insights.studentsLowScores', { count: lowScores.length }),
      actionRoute: '/(teacher)/students/needs-support',
    });
  }

  // Rule 3: Attendance drop
  if (previousAnalytics && analytics.attendanceRate < previousAnalytics.attendanceRate - 5) {
    insights.push({
      id: 'attendance-drop',
      severity: 'danger',
      icon: 'time-outline',
      title: t('insights.attendanceDrop', { rate: Math.round(analytics.attendanceRate) }),
      description: t('insights.attendanceDropDetail', {
        previousRate: Math.round(previousAnalytics.attendanceRate),
      }),
    });
  }

  // Rule 4: Attendance improvement
  if (previousAnalytics && analytics.attendanceRate > previousAnalytics.attendanceRate + 5) {
    insights.push({
      id: 'attendance-up',
      severity: 'success',
      icon: 'arrow-up-circle',
      title: t('insights.attendanceUp', {
        rate: Math.round(analytics.attendanceRate),
        change: Math.round(analytics.attendanceRate - previousAnalytics.attendanceRate),
      }),
    });
  }

  // Rule 5: Score improvement (any dimension improved by >= 0.3)
  if (previousAnalytics) {
    const memDiff = analytics.averageMemorization - previousAnalytics.averageMemorization;
    const tajDiff = analytics.averageTajweed - previousAnalytics.averageTajweed;
    const recDiff = analytics.averageRecitation - previousAnalytics.averageRecitation;

    if (memDiff >= 0.3 || tajDiff >= 0.3 || recDiff >= 0.3) {
      const best = Math.max(memDiff, tajDiff, recDiff);
      const dimension =
        best === memDiff ? 'memorization' : best === tajDiff ? 'tajweed' : 'recitation';
      insights.push({
        id: 'score-improved',
        severity: 'success',
        icon: 'trophy',
        title: t('insights.scoreImproved', {
          dimension: t(`insights.dimension.${dimension}`),
          change: `+${best.toFixed(1)}`,
        }),
      });
    }
  }

  // Rule 6: Weakest dimension (one dimension ≥0.5 below the others AND below 3.5)
  const dims = [
    { key: 'memorization', val: analytics.averageMemorization },
    { key: 'tajweed', val: analytics.averageTajweed },
    { key: 'recitation', val: analytics.averageRecitation },
  ].sort((a, b) => a.val - b.val);

  if (dims[0].val < 3.5 && dims[1].val - dims[0].val >= 0.5) {
    insights.push({
      id: 'weakest-dimension',
      severity: 'warning',
      icon: 'book-outline',
      title: t('insights.weakestDimension', {
        dimension: t(`insights.dimension.${dims[0].key}`),
      }),
      description: t('insights.weakestDimensionDetail', {
        score: dims[0].val.toFixed(1),
      }),
    });
  }

  // Rule 7: Top performers (students with score ≥ 4.0, show top 3)
  const topStudents = studentStatuses
    .filter((s) => s.recentAvgScore >= 4.0)
    .sort((a, b) => b.recentAvgScore - a.recentAvgScore)
    .slice(0, 3);

  if (topStudents.length > 0) {
    const names = topStudents
      .map((s) => `${s.fullName} (${s.recentAvgScore.toFixed(1)})`)
      .join(', ');
    insights.push({
      id: 'top-performers',
      severity: 'info',
      icon: 'star',
      title: t('insights.topPerformers'),
      description: names,
    });
  }

  // Rule 8: Streak leaders (students with streak ≥ 5)
  const streakLeaders = studentStatuses
    .filter((s) => s.currentStreak >= 5)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 3);

  if (streakLeaders.length > 0) {
    const names = streakLeaders
      .map((s) => `${s.fullName}: ${s.currentStreak}`)
      .join(', ');
    insights.push({
      id: 'streak-leaders',
      severity: 'info',
      icon: 'flame',
      title: t('insights.streakLeaders'),
      description: names,
    });
  }

  // Rule 9: Engagement drop (stickers down >50%)
  if (
    previousStickersCount != null &&
    previousStickersCount > 0 &&
    stickersCount < previousStickersCount * 0.5
  ) {
    insights.push({
      id: 'engagement-drop',
      severity: 'warning',
      icon: 'ribbon-outline',
      title: t('insights.engagementDrop'),
      description: t('insights.engagementDropDetail', {
        current: stickersCount,
        previous: previousStickersCount,
      }),
    });
  }

  // Rule 10: Engagement surge (stickers up >50% and at least 3)
  if (
    previousStickersCount != null &&
    stickersCount > previousStickersCount * 1.5 &&
    stickersCount >= 3
  ) {
    insights.push({
      id: 'engagement-surge',
      severity: 'success',
      icon: 'ribbon',
      title: t('insights.engagementSurge'),
      description: t('insights.engagementSurgeDetail', {
        current: stickersCount,
        previous: previousStickersCount,
      }),
    });
  }

  // Rule 11: Students at risk (red status, not already covered by declining/low-scores)
  const decliningIds = new Set(declining.map((s) => s.studentId));
  const lowScoreIds = new Set(lowScores.map((s) => s.studentId));
  const atRiskStudents = studentStatuses.filter(
    (s) => s.status === 'red' && !decliningIds.has(s.studentId) && !lowScoreIds.has(s.studentId),
  );

  if (atRiskStudents.length > 0) {
    const names = atRiskStudents
      .slice(0, 3)
      .map((s) => s.fullName)
      .join(', ');
    insights.push({
      id: 'students-at-risk',
      severity: 'warning',
      icon: 'warning-outline',
      title: t('insights.studentsAtRisk', { count: atRiskStudents.length }),
      description: t('insights.studentsAtRiskDetail', { names }),
    });
  }

  // Rule 12: All healthy -- fallback
  if (insights.length === 0) {
    insights.push({
      id: 'all-good',
      severity: 'success',
      icon: 'checkmark-circle',
      title: t('insights.allGood'),
    });
  }

  return insights;
}

// ─── Teacher Pulse Message ──────────────────────────────────────────────────

export function generateTeacherPulseMessage(
  analytics: ClassAnalytics | undefined,
  attentionStudents: StudentNeedingAttention[],
  t: TFunction,
): { status: HealthStatus; message: string } {
  if (!analytics) {
    return { status: 'green', message: t('insights.noData') };
  }

  const attendanceStatus = getHealthStatus(analytics.attendanceRate, ATTENDANCE_THRESHOLDS);
  const avgScore =
    (analytics.averageMemorization + analytics.averageTajweed + analytics.averageRecitation) / 3;
  const scoreStatus = getHealthStatus(avgScore, SCORE_THRESHOLDS);
  const overall = worstStatus(attendanceStatus, scoreStatus);

  if (overall === 'green') {
    return {
      status: 'green',
      message: t('insights.classHealthy', {
        rate: Math.round(analytics.attendanceRate),
      }),
    };
  }

  if (overall === 'yellow') {
    const detail =
      attentionStudents.length > 0
        ? t('insights.classAttentionStudents', { count: attentionStudents.length })
        : attendanceStatus === 'yellow'
          ? t('insights.classAttentionAttendance')
          : t('insights.classAttentionScores');
    return {
      status: 'yellow',
      message: t('insights.classAttention', { detail }),
    };
  }

  return {
    status: 'red',
    message: t('insights.classConcern', {
      count: attentionStudents.length,
      rate: Math.round(analytics.attendanceRate),
    }),
  };
}

// ─── Teacher Health Metrics ─────────────────────────────────────────────────

export function buildTeacherHealthMetrics(
  analytics: ClassAnalytics | undefined,
  previousAnalytics: ClassAnalytics | undefined | null,
  stickersCount: number,
  previousStickersCount: number | null,
  t: TFunction,
): { attendance: HealthMetric; scores: HealthMetric; engagement: HealthMetric } {
  const attendanceVal = analytics?.attendanceRate ?? 0;
  const prevAttendance = previousAnalytics?.attendanceRate ?? null;
  const avgScore = analytics
    ? (analytics.averageMemorization + analytics.averageTajweed + analytics.averageRecitation) / 3
    : 0;
  const prevAvgScore = previousAnalytics
    ? (previousAnalytics.averageMemorization +
        previousAnalytics.averageTajweed +
        previousAnalytics.averageRecitation) /
      3
    : null;

  return {
    attendance: {
      label: t('insights.metric.attendance'),
      value: attendanceVal,
      displayValue: `${Math.round(attendanceVal)}%`,
      status: getHealthStatus(attendanceVal, ATTENDANCE_THRESHOLDS),
      trend: getTrendDirection(attendanceVal, prevAttendance, 3),
      trendLabel: formatTrendLabel(attendanceVal, prevAttendance, 'percentage'),
    },
    scores: {
      label: t('insights.metric.scores'),
      value: avgScore,
      displayValue: `${avgScore.toFixed(1)} ${t(`insights.scoreLabel.${getScoreLabel(avgScore)}`)}`,
      status: getHealthStatus(avgScore, SCORE_THRESHOLDS),
      trend: getTrendDirection(avgScore, prevAvgScore, 0.2),
      trendLabel: formatTrendLabel(avgScore, prevAvgScore, 'score'),
    },
    engagement: {
      label: t('insights.metric.engagement'),
      value: stickersCount,
      displayValue: t('insights.stickersCount', { count: stickersCount }),
      status: stickersCount > 0 ? 'green' : 'yellow',
      trend: getTrendDirection(stickersCount, previousStickersCount, 1),
      trendLabel: formatTrendLabel(stickersCount, previousStickersCount, 'percentage'),
    },
  };
}

// ─── Admin Insights ─────────────────────────────────────────────────────────

export function generateAdminInsights(
  kpis: SchoolKPISummary | undefined,
  previousKpis: SchoolKPISummary | undefined | null,
  teacherActivity: TeacherActivitySummary[],
  sessionCompletion: SessionCompletionStat[],
  t: TFunction,
): InsightData[] {
  if (!kpis) return [];

  const insights: InsightData[] = [];

  // Rule 1: Inactive teachers (no sessions logged)
  const inactiveTeachers = teacherActivity.filter((ta) => ta.sessionsLogged === 0);
  if (inactiveTeachers.length > 0) {
    insights.push({
      id: 'inactive-teachers',
      severity: 'warning',
      icon: 'person-outline',
      title: t('insights.teachersInactive', { count: inactiveTeachers.length }),
      description: inactiveTeachers
        .slice(0, 2)
        .map((ta) => ta.fullName)
        .join(', '),
      actionRoute: '/(master-admin)/reports/teacher-activity',
    });
  }

  // Rule 2: Attendance drop
  if (previousKpis && kpis.attendanceRate < previousKpis.attendanceRate - 5) {
    insights.push({
      id: 'school-attendance-drop',
      severity: 'danger',
      icon: 'trending-down',
      title: t('insights.schoolAttendanceDrop', {
        rate: Math.round(kpis.attendanceRate),
        previousRate: Math.round(previousKpis.attendanceRate),
      }),
    });
  }

  // Rule 3: Low session completion
  const lowCompletionTeachers = sessionCompletion.filter((sc) => sc.completionRate < 70);
  if (lowCompletionTeachers.length > 0) {
    insights.push({
      id: 'low-session-completion',
      severity: 'warning',
      icon: 'close-circle-outline',
      title: t('insights.lowSessionCompletion', { count: lowCompletionTeachers.length }),
      actionRoute: '/(master-admin)/reports/session-completion',
    });
  }

  // Rule 4: Attendance improvement celebration
  if (previousKpis && kpis.attendanceRate > previousKpis.attendanceRate + 5) {
    insights.push({
      id: 'attendance-celebration',
      severity: 'success',
      icon: 'ribbon',
      title: t('insights.schoolAttendanceUp', { rate: Math.round(kpis.attendanceRate) }),
    });
  }

  // Rule 5: Score improvement
  if (previousKpis && kpis.averageScore > previousKpis.averageScore + 0.3) {
    insights.push({
      id: 'score-celebration',
      severity: 'success',
      icon: 'star',
      title: t('insights.schoolScoreUp', {
        score: kpis.averageScore.toFixed(1),
        change: `+${(kpis.averageScore - previousKpis.averageScore).toFixed(1)}`,
      }),
    });
  }

  // Rule 6: All healthy fallback
  if (insights.length === 0) {
    insights.push({
      id: 'school-all-good',
      severity: 'success',
      icon: 'checkmark-circle',
      title: t('insights.schoolAllGood'),
    });
  }

  return insights.slice(0, 5);
}

// ─── Admin Pulse Message ────────────────────────────────────────────────────

export function generateAdminPulseMessage(
  kpis: SchoolKPISummary | undefined,
  teacherActivity: TeacherActivitySummary[],
  t: TFunction,
): { status: HealthStatus; message: string } {
  if (!kpis) {
    return { status: 'green', message: t('insights.noData') };
  }

  const attendanceStatus = getHealthStatus(kpis.attendanceRate, ATTENDANCE_THRESHOLDS);
  const scoreStatus = getHealthStatus(kpis.averageScore, SCORE_THRESHOLDS);
  const inactiveTeachers = teacherActivity.filter((ta) => ta.sessionsLogged === 0);
  const teacherStatus: HealthStatus = inactiveTeachers.length === 0 ? 'green' : inactiveTeachers.length <= 1 ? 'yellow' : 'red';
  const overall = worstStatus(attendanceStatus, scoreStatus, teacherStatus);

  if (overall === 'green') {
    return {
      status: 'green',
      message: t('insights.schoolHealthy', {
        rate: Math.round(kpis.attendanceRate),
        teachers: kpis.activeTeachers,
      }),
    };
  }

  if (overall === 'yellow') {
    return {
      status: 'yellow',
      message: t('insights.schoolNeedsAttention'),
    };
  }

  return {
    status: 'red',
    message: t('insights.schoolConcern', {
      rate: Math.round(kpis.attendanceRate),
    }),
  };
}
