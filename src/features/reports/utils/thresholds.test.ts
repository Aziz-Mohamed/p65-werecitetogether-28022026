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
} from './thresholds';

describe('getHealthStatus', () => {
  it('returns green when value >= green threshold', () => {
    expect(getHealthStatus(90, ATTENDANCE_THRESHOLDS)).toBe('green');
    expect(getHealthStatus(85, ATTENDANCE_THRESHOLDS)).toBe('green');
  });

  it('returns yellow when value >= yellow but < green', () => {
    expect(getHealthStatus(84, ATTENDANCE_THRESHOLDS)).toBe('yellow');
    expect(getHealthStatus(70, ATTENDANCE_THRESHOLDS)).toBe('yellow');
  });

  it('returns red when value < yellow threshold', () => {
    expect(getHealthStatus(69, ATTENDANCE_THRESHOLDS)).toBe('red');
    expect(getHealthStatus(0, ATTENDANCE_THRESHOLDS)).toBe('red');
  });

  it('works with SCORE_THRESHOLDS', () => {
    expect(getHealthStatus(4.0, SCORE_THRESHOLDS)).toBe('green');
    expect(getHealthStatus(3.5, SCORE_THRESHOLDS)).toBe('yellow');
    expect(getHealthStatus(2.9, SCORE_THRESHOLDS)).toBe('red');
  });

  it('works with PUNCTUALITY_THRESHOLDS', () => {
    expect(getHealthStatus(90, PUNCTUALITY_THRESHOLDS)).toBe('green');
    expect(getHealthStatus(80, PUNCTUALITY_THRESHOLDS)).toBe('yellow');
    expect(getHealthStatus(60, PUNCTUALITY_THRESHOLDS)).toBe('red');
  });

  it('works with SESSION_COMPLETION_THRESHOLDS', () => {
    expect(getHealthStatus(95, SESSION_COMPLETION_THRESHOLDS)).toBe('green');
    expect(getHealthStatus(80, SESSION_COMPLETION_THRESHOLDS)).toBe('yellow');
    expect(getHealthStatus(74, SESSION_COMPLETION_THRESHOLDS)).toBe('red');
  });
});

describe('getTrendDirection', () => {
  it('returns steady when previous is null', () => {
    expect(getTrendDirection(80, null)).toBe('steady');
  });

  it('returns up when diff > threshold', () => {
    expect(getTrendDirection(82, 80)).toBe('up');
    expect(getTrendDirection(85, 80)).toBe('up');
  });

  it('returns down when diff < -threshold', () => {
    expect(getTrendDirection(78, 80)).toBe('down');
    expect(getTrendDirection(70, 80)).toBe('down');
  });

  it('returns steady within threshold range', () => {
    expect(getTrendDirection(80.5, 80)).toBe('steady');
    expect(getTrendDirection(79.5, 80)).toBe('steady');
    expect(getTrendDirection(81, 80)).toBe('steady');
    expect(getTrendDirection(79, 80)).toBe('steady');
  });

  it('respects custom threshold', () => {
    expect(getTrendDirection(85, 80, 3)).toBe('up');
    expect(getTrendDirection(82, 80, 3)).toBe('steady');
    expect(getTrendDirection(76, 80, 3)).toBe('down');
  });
});

describe('formatTrendLabel', () => {
  it('returns "--" when previous is null', () => {
    expect(formatTrendLabel(80, null)).toBe('--');
  });

  it('formats percentage with sign', () => {
    expect(formatTrendLabel(85, 80, 'percentage')).toBe('+5%');
    expect(formatTrendLabel(75, 80, 'percentage')).toBe('-5%');
    expect(formatTrendLabel(80, 80, 'percentage')).toBe('+0%');
  });

  it('formats score with one decimal', () => {
    expect(formatTrendLabel(4.2, 3.9, 'score')).toBe('+0.3');
    expect(formatTrendLabel(3.5, 4.0, 'score')).toBe('-0.5');
    expect(formatTrendLabel(4.0, 4.0, 'score')).toBe('+0.0');
  });

  it('defaults to percentage format', () => {
    expect(formatTrendLabel(85, 80)).toBe('+5%');
  });
});

describe('getScoreLabel', () => {
  it('returns excellent for >= 4.5', () => {
    expect(getScoreLabel(4.5)).toBe('excellent');
    expect(getScoreLabel(5.0)).toBe('excellent');
  });

  it('returns good for >= 3.5 and < 4.5', () => {
    expect(getScoreLabel(3.5)).toBe('good');
    expect(getScoreLabel(4.4)).toBe('good');
  });

  it('returns developing for >= 2.5 and < 3.5', () => {
    expect(getScoreLabel(2.5)).toBe('developing');
    expect(getScoreLabel(3.4)).toBe('developing');
  });

  it('returns needsWork for < 2.5', () => {
    expect(getScoreLabel(2.4)).toBe('needsWork');
    expect(getScoreLabel(0)).toBe('needsWork');
  });
});

describe('worstStatus', () => {
  it('returns red if any status is red', () => {
    expect(worstStatus('red', 'green', 'yellow')).toBe('red');
    expect(worstStatus('green', 'red')).toBe('red');
  });

  it('returns yellow if worst is yellow', () => {
    expect(worstStatus('yellow', 'green')).toBe('yellow');
    expect(worstStatus('green', 'yellow', 'green')).toBe('yellow');
  });

  it('returns green when all are green', () => {
    expect(worstStatus('green', 'green', 'green')).toBe('green');
    expect(worstStatus('green')).toBe('green');
  });
});
