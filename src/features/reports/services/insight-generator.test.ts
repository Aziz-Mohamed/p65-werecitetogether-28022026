import type { TFunction } from 'i18next';
import type {
  ClassAnalytics,
  StudentNeedingAttention,
  StudentQuickStatus,
  SchoolKPISummary,
  TeacherActivitySummary,
  SessionCompletionStat,
} from '../types/reports.types';
import {
  generateTeacherInsights,
  generateTeacherPulseMessage,
  buildTeacherHealthMetrics,
  generateAdminInsights,
  generateAdminPulseMessage,
} from './insight-generator';

// Passthrough t function — returns the key so we can assert on it
const t: TFunction = ((key: string) => key) as any;

// ─── Factory Helpers ────────────────────────────────────────────────────────

function makeAnalytics(overrides: Partial<ClassAnalytics> = {}): ClassAnalytics {
  return {
    classId: 'c1',
    className: 'Class A',
    studentCount: 20,
    attendanceRate: 90,
    averageMemorization: 4.0,
    averageTajweed: 4.0,
    averageRecitation: 4.0,
    levelDistribution: [],
    ...overrides,
  };
}

function makeAttention(overrides: Partial<StudentNeedingAttention> = {}): StudentNeedingAttention {
  return {
    studentId: 's1',
    fullName: 'Student One',
    avatarUrl: null,
    currentAvg: 2.5,
    previousAvg: 3.5,
    declineAmount: 1.0,
    flagReason: 'declining',
    ...overrides,
  };
}

function makeStatus(overrides: Partial<StudentQuickStatus> = {}): StudentQuickStatus {
  return {
    studentId: 's1',
    fullName: 'Student One',
    status: 'green',
    currentLevel: 3,
    currentStreak: 2,
    recentAvgScore: 3.5,
    ...overrides,
  };
}

function makeKPIs(overrides: Partial<SchoolKPISummary> = {}): SchoolKPISummary {
  return {
    activeStudents: 100,
    activeTeachers: 5,
    totalClasses: 4,
    attendanceRate: 90,
    averageScore: 4.0,
    totalStickersAwarded: 50,
    ...overrides,
  };
}

function makeTeacherActivity(overrides: Partial<TeacherActivitySummary> = {}): TeacherActivitySummary {
  return {
    teacherId: 't1',
    fullName: 'Teacher One',
    avatarUrl: null,
    sessionsLogged: 10,
    uniqueStudentsEvaluated: 8,
    stickersAwarded: 5,
    lastActiveDate: '2026-03-01',
    ...overrides,
  };
}

function makeSessionCompletion(overrides: Partial<SessionCompletionStat> = {}): SessionCompletionStat {
  return {
    teacherId: 't1',
    fullName: 'Teacher One',
    totalScheduled: 10,
    completedCount: 9,
    cancelledCount: 1,
    missedCount: 0,
    completionRate: 90,
    ...overrides,
  };
}

// ─── Teacher Insights ───────────────────────────────────────────────────────

describe('generateTeacherInsights', () => {
  it('returns empty array when analytics is undefined', () => {
    const result = generateTeacherInsights(undefined, null, [], 0, null, [], t);
    expect(result).toEqual([]);
  });

  it('returns all-good fallback when no issues detected', () => {
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      5,
      null,
      [],
      t,
    );
    expect(insights).toHaveLength(1);
    expect(insights[0].id).toBe('all-good');
    expect(insights[0].severity).toBe('success');
  });

  // Rule 1: Declining students
  it('detects declining students', () => {
    const declining = [makeAttention({ flagReason: 'declining' })];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      declining,
      0,
      null,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'declining-students')).toBeDefined();
    expect(insights.find((i) => i.id === 'declining-students')!.severity).toBe('warning');
  });

  // Rule 2: Low-score students (only when no declining)
  it('detects low-score students when no declining', () => {
    const lowScores = [makeAttention({ flagReason: 'low_scores' })];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      lowScores,
      0,
      null,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'low-score-students')).toBeDefined();
  });

  it('suppresses low-score when declining students exist', () => {
    const students = [
      makeAttention({ studentId: 's1', flagReason: 'declining' }),
      makeAttention({ studentId: 's2', flagReason: 'low_scores' }),
    ];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      students,
      0,
      null,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'declining-students')).toBeDefined();
    expect(insights.find((i) => i.id === 'low-score-students')).toBeUndefined();
  });

  // Rule 3: Attendance drop
  it('detects attendance drop > 5 points', () => {
    const current = makeAnalytics({ attendanceRate: 74 });
    const previous = makeAnalytics({ attendanceRate: 80 });
    const insights = generateTeacherInsights(current, previous, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'attendance-drop')).toBeDefined();
    expect(insights.find((i) => i.id === 'attendance-drop')!.severity).toBe('danger');
  });

  it('does not flag attendance drop of exactly 5', () => {
    const current = makeAnalytics({ attendanceRate: 75 });
    const previous = makeAnalytics({ attendanceRate: 80 });
    const insights = generateTeacherInsights(current, previous, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'attendance-drop')).toBeUndefined();
  });

  // Rule 4: Attendance improvement
  it('detects attendance improvement > 5 points', () => {
    const current = makeAnalytics({ attendanceRate: 90 });
    const previous = makeAnalytics({ attendanceRate: 84 });
    const insights = generateTeacherInsights(current, previous, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'attendance-up')).toBeDefined();
    expect(insights.find((i) => i.id === 'attendance-up')!.severity).toBe('success');
  });

  // Rule 5: Score improvement (any dimension >= 0.3)
  it('detects score improvement in memorization', () => {
    const current = makeAnalytics({ averageMemorization: 4.5 });
    const previous = makeAnalytics({ averageMemorization: 4.0 });
    const insights = generateTeacherInsights(current, previous, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'score-improved')).toBeDefined();
  });

  it('does not flag score improvement < 0.3', () => {
    const current = makeAnalytics({ averageMemorization: 4.2 });
    const previous = makeAnalytics({ averageMemorization: 4.0 });
    const insights = generateTeacherInsights(current, previous, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'score-improved')).toBeUndefined();
  });

  // Rule 6: Weakest dimension
  it('detects weakest dimension below 3.5 with gap >= 0.5', () => {
    const analytics = makeAnalytics({
      averageMemorization: 2.8,
      averageTajweed: 4.0,
      averageRecitation: 3.8,
    });
    const insights = generateTeacherInsights(analytics, null, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'weakest-dimension')).toBeDefined();
  });

  it('does not flag weakest dimension if all above 3.5', () => {
    const analytics = makeAnalytics({
      averageMemorization: 3.6,
      averageTajweed: 4.0,
      averageRecitation: 3.8,
    });
    const insights = generateTeacherInsights(analytics, null, [], 0, null, [], t);
    expect(insights.find((i) => i.id === 'weakest-dimension')).toBeUndefined();
  });

  // Rule 7: Top performers
  it('detects top performers with score >= 4.0', () => {
    const statuses = [
      makeStatus({ studentId: 's1', recentAvgScore: 4.5, fullName: 'A' }),
      makeStatus({ studentId: 's2', recentAvgScore: 4.1, fullName: 'B' }),
    ];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      0,
      null,
      statuses,
      t,
    );
    expect(insights.find((i) => i.id === 'top-performers')).toBeDefined();
  });

  it('limits top performers to 3 names', () => {
    const statuses = Array.from({ length: 5 }, (_, i) =>
      makeStatus({ studentId: `s${i}`, recentAvgScore: 4.5, fullName: `Student ${i}` }),
    );
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      0,
      null,
      statuses,
      t,
    );
    const tp = insights.find((i) => i.id === 'top-performers');
    // Description contains comma-separated names — at most 3
    const nameCount = tp!.description!.split(',').length;
    expect(nameCount).toBeLessThanOrEqual(3);
  });

  // Rule 8: Streak leaders
  it('detects streak leaders with streak >= 5', () => {
    const statuses = [makeStatus({ currentStreak: 7, fullName: 'Streak Star' })];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      0,
      null,
      statuses,
      t,
    );
    expect(insights.find((i) => i.id === 'streak-leaders')).toBeDefined();
  });

  it('does not flag streak < 5', () => {
    const statuses = [makeStatus({ currentStreak: 4 })];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      0,
      null,
      statuses,
      t,
    );
    expect(insights.find((i) => i.id === 'streak-leaders')).toBeUndefined();
  });

  // Rule 9: Engagement drop
  it('detects engagement drop (stickers down >50%)', () => {
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      2,
      10,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'engagement-drop')).toBeDefined();
  });

  it('does not flag engagement drop when previous is 0', () => {
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      0,
      0,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'engagement-drop')).toBeUndefined();
  });

  // Rule 10: Engagement surge
  it('detects engagement surge (stickers up >50% and >= 3)', () => {
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      6,
      3,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'engagement-surge')).toBeDefined();
  });

  it('does not flag surge when stickers < 3', () => {
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      2,
      1,
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'engagement-surge')).toBeUndefined();
  });

  // Rule 11: Students at risk
  it('detects at-risk students not already in declining/low-scores', () => {
    const atRisk = makeStatus({ studentId: 's3', status: 'red', fullName: 'Risk Student' });
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      [],
      0,
      null,
      [atRisk],
      t,
    );
    expect(insights.find((i) => i.id === 'students-at-risk')).toBeDefined();
  });

  it('excludes at-risk students already covered by declining', () => {
    const declining = [makeAttention({ studentId: 's1', flagReason: 'declining' })];
    const statuses = [makeStatus({ studentId: 's1', status: 'red' })];
    const insights = generateTeacherInsights(
      makeAnalytics(),
      null,
      declining,
      0,
      null,
      statuses,
      t,
    );
    expect(insights.find((i) => i.id === 'students-at-risk')).toBeUndefined();
  });

  // Multiple insights coexist
  it('can return multiple insights simultaneously', () => {
    const declining = [makeAttention({ flagReason: 'declining' })];
    const current = makeAnalytics({ attendanceRate: 70 });
    const previous = makeAnalytics({ attendanceRate: 80 });
    const insights = generateTeacherInsights(
      current,
      previous,
      declining,
      2,
      10,
      [],
      t,
    );
    const ids = insights.map((i) => i.id);
    expect(ids).toContain('declining-students');
    expect(ids).toContain('attendance-drop');
    expect(ids).toContain('engagement-drop');
  });
});

// ─── Teacher Pulse Message ──────────────────────────────────────────────────

describe('generateTeacherPulseMessage', () => {
  it('returns green with noData message when analytics undefined', () => {
    const result = generateTeacherPulseMessage(undefined, [], t);
    expect(result.status).toBe('green');
    expect(result.message).toBe('insights.noData');
  });

  it('returns green when attendance and scores are healthy', () => {
    const analytics = makeAnalytics({ attendanceRate: 90 });
    const result = generateTeacherPulseMessage(analytics, [], t);
    expect(result.status).toBe('green');
  });

  it('returns yellow when attendance is in yellow zone', () => {
    const analytics = makeAnalytics({ attendanceRate: 75 });
    const result = generateTeacherPulseMessage(analytics, [], t);
    expect(result.status).toBe('yellow');
  });

  it('returns red when attendance or scores are in red zone', () => {
    const analytics = makeAnalytics({ attendanceRate: 50 });
    const result = generateTeacherPulseMessage(analytics, [], t);
    expect(result.status).toBe('red');
  });

  it('returns red when scores are in red zone', () => {
    const analytics = makeAnalytics({
      attendanceRate: 90,
      averageMemorization: 2.0,
      averageTajweed: 2.0,
      averageRecitation: 2.0,
    });
    const result = generateTeacherPulseMessage(analytics, [], t);
    expect(result.status).toBe('red');
  });
});

// ─── Teacher Health Metrics ─────────────────────────────────────────────────

describe('buildTeacherHealthMetrics', () => {
  it('computes average score from 3 dimensions', () => {
    const analytics = makeAnalytics({
      averageMemorization: 3.0,
      averageTajweed: 4.0,
      averageRecitation: 5.0,
    });
    const metrics = buildTeacherHealthMetrics(analytics, null, 5, null, t);
    expect(metrics.scores.value).toBe(4.0);
  });

  it('uses attendance threshold for trend', () => {
    const current = makeAnalytics({ attendanceRate: 90 });
    const previous = makeAnalytics({ attendanceRate: 86 });
    const metrics = buildTeacherHealthMetrics(current, previous, 0, null, t);
    // Diff = 4, threshold = 3 → up
    expect(metrics.attendance.trend).toBe('up');
  });

  it('uses score threshold of 0.2 for trend', () => {
    const current = makeAnalytics({
      averageMemorization: 4.1,
      averageTajweed: 4.1,
      averageRecitation: 4.1,
    });
    const previous = makeAnalytics({
      averageMemorization: 3.8,
      averageTajweed: 3.8,
      averageRecitation: 3.8,
    });
    const metrics = buildTeacherHealthMetrics(current, previous, 0, null, t);
    // Diff = 0.3, threshold = 0.2 → up
    expect(metrics.scores.trend).toBe('up');
  });

  it('engagement status is green when stickers > 0', () => {
    const metrics = buildTeacherHealthMetrics(makeAnalytics(), null, 5, null, t);
    expect(metrics.engagement.status).toBe('green');
  });

  it('engagement status is yellow when stickers === 0', () => {
    const metrics = buildTeacherHealthMetrics(makeAnalytics(), null, 0, null, t);
    expect(metrics.engagement.status).toBe('yellow');
  });

  it('returns zeros when analytics is undefined', () => {
    const metrics = buildTeacherHealthMetrics(undefined, null, 0, null, t);
    expect(metrics.attendance.value).toBe(0);
    expect(metrics.scores.value).toBe(0);
  });
});

// ─── Admin Insights ─────────────────────────────────────────────────────────

describe('generateAdminInsights', () => {
  it('returns empty array when kpis is undefined', () => {
    const result = generateAdminInsights(undefined, null, [], [], t);
    expect(result).toEqual([]);
  });

  it('returns all-good fallback when no issues', () => {
    const insights = generateAdminInsights(
      makeKPIs(),
      null,
      [makeTeacherActivity()],
      [makeSessionCompletion()],
      t,
    );
    expect(insights).toHaveLength(1);
    expect(insights[0].id).toBe('school-all-good');
  });

  // Rule 1: Inactive teachers
  it('detects inactive teachers', () => {
    const teachers = [makeTeacherActivity({ sessionsLogged: 0 })];
    const insights = generateAdminInsights(makeKPIs(), null, teachers, [], t);
    expect(insights.find((i) => i.id === 'inactive-teachers')).toBeDefined();
  });

  // Rule 2: School attendance drop
  it('detects school attendance drop > 5 points', () => {
    const current = makeKPIs({ attendanceRate: 74 });
    const previous = makeKPIs({ attendanceRate: 80 });
    const insights = generateAdminInsights(current, previous, [makeTeacherActivity()], [], t);
    expect(insights.find((i) => i.id === 'school-attendance-drop')).toBeDefined();
  });

  // Rule 3: Low session completion
  it('detects low session completion (< 70%)', () => {
    const sessions = [makeSessionCompletion({ completionRate: 60 })];
    const insights = generateAdminInsights(
      makeKPIs(),
      null,
      [makeTeacherActivity()],
      sessions,
      t,
    );
    expect(insights.find((i) => i.id === 'low-session-completion')).toBeDefined();
  });

  // Rule 4: Attendance celebration
  it('detects attendance improvement > 5 points', () => {
    const current = makeKPIs({ attendanceRate: 90 });
    const previous = makeKPIs({ attendanceRate: 84 });
    const insights = generateAdminInsights(
      current,
      previous,
      [makeTeacherActivity()],
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'attendance-celebration')).toBeDefined();
  });

  // Rule 5: Score improvement
  it('detects score improvement > 0.3', () => {
    const current = makeKPIs({ averageScore: 4.5 });
    const previous = makeKPIs({ averageScore: 4.1 });
    const insights = generateAdminInsights(
      current,
      previous,
      [makeTeacherActivity()],
      [],
      t,
    );
    expect(insights.find((i) => i.id === 'score-celebration')).toBeDefined();
  });

  it('returns at most 5 insights', () => {
    const current = makeKPIs({ attendanceRate: 50, averageScore: 4.5 });
    const previous = makeKPIs({ attendanceRate: 80, averageScore: 4.1 });
    const inactives = Array.from({ length: 3 }, (_, i) =>
      makeTeacherActivity({ teacherId: `t${i}`, sessionsLogged: 0 }),
    );
    const lowCompletion = [makeSessionCompletion({ completionRate: 50 })];
    const insights = generateAdminInsights(current, previous, inactives, lowCompletion, t);
    expect(insights.length).toBeLessThanOrEqual(5);
  });
});

// ─── Admin Pulse Message ────────────────────────────────────────────────────

describe('generateAdminPulseMessage', () => {
  it('returns green with noData when kpis undefined', () => {
    const result = generateAdminPulseMessage(undefined, [], t);
    expect(result.status).toBe('green');
    expect(result.message).toBe('insights.noData');
  });

  it('returns green when everything is healthy', () => {
    const result = generateAdminPulseMessage(
      makeKPIs(),
      [makeTeacherActivity()],
      t,
    );
    expect(result.status).toBe('green');
  });

  it('returns yellow when 1 inactive teacher', () => {
    const teachers = [
      makeTeacherActivity({ sessionsLogged: 0 }),
      makeTeacherActivity({ teacherId: 't2', sessionsLogged: 5 }),
    ];
    const result = generateAdminPulseMessage(makeKPIs(), teachers, t);
    expect(result.status).toBe('yellow');
  });

  it('returns red when >= 2 inactive teachers', () => {
    const teachers = [
      makeTeacherActivity({ teacherId: 't1', sessionsLogged: 0 }),
      makeTeacherActivity({ teacherId: 't2', sessionsLogged: 0 }),
    ];
    const result = generateAdminPulseMessage(makeKPIs(), teachers, t);
    expect(result.status).toBe('red');
  });

  it('returns red when attendance is in red zone', () => {
    const result = generateAdminPulseMessage(
      makeKPIs({ attendanceRate: 50 }),
      [makeTeacherActivity()],
      t,
    );
    expect(result.status).toBe('red');
  });
});
