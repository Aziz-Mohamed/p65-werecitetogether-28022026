import {
  getDecayInterval,
  computeFreshness,
  freshnessToState,
  computePoorRevisionTimestamp,
} from './freshness';

const NOW = new Date('2026-03-07T12:00:00.000Z').getTime();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// getDecayInterval
// ---------------------------------------------------------------------------
describe('getDecayInterval', () => {
  it('returns 14 for reviewCount 0', () => {
    expect(getDecayInterval(0)).toBe(14);
  });

  it('returns 14 for negative reviewCount', () => {
    expect(getDecayInterval(-1)).toBe(14);
    expect(getDecayInterval(-100)).toBe(14);
  });

  it('returns 21 for reviewCount 1', () => {
    expect(getDecayInterval(1)).toBe(21);
  });

  it('returns 30 for reviewCount 2', () => {
    expect(getDecayInterval(2)).toBe(30);
  });

  it('returns 45 for reviewCount 3', () => {
    expect(getDecayInterval(3)).toBe(45);
  });

  it('returns 60 for reviewCount 4 and 5', () => {
    expect(getDecayInterval(4)).toBe(60);
    expect(getDecayInterval(5)).toBe(60);
  });

  it('returns 75 for reviewCount 6 through 8', () => {
    expect(getDecayInterval(6)).toBe(75);
    expect(getDecayInterval(7)).toBe(75);
    expect(getDecayInterval(8)).toBe(75);
  });

  it('returns 90 for reviewCount 9 through 11', () => {
    expect(getDecayInterval(9)).toBe(90);
    expect(getDecayInterval(10)).toBe(90);
    expect(getDecayInterval(11)).toBe(90);
  });

  it('returns 120 for reviewCount 12 and above', () => {
    expect(getDecayInterval(12)).toBe(120);
    expect(getDecayInterval(50)).toBe(120);
    expect(getDecayInterval(1000)).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// freshnessToState
// ---------------------------------------------------------------------------
describe('freshnessToState', () => {
  it('returns dormant for 0', () => {
    expect(freshnessToState(0)).toBe('dormant');
  });

  it('returns dormant for negative values', () => {
    expect(freshnessToState(-1)).toBe('dormant');
    expect(freshnessToState(-50)).toBe('dormant');
  });

  it('returns critical for 1 through 24', () => {
    expect(freshnessToState(1)).toBe('critical');
    expect(freshnessToState(12)).toBe('critical');
    expect(freshnessToState(24)).toBe('critical');
  });

  it('returns warning at boundary 25', () => {
    expect(freshnessToState(25)).toBe('warning');
  });

  it('returns warning for 25 through 49', () => {
    expect(freshnessToState(25)).toBe('warning');
    expect(freshnessToState(37)).toBe('warning');
    expect(freshnessToState(49)).toBe('warning');
  });

  it('returns fading at boundary 50', () => {
    expect(freshnessToState(50)).toBe('fading');
  });

  it('returns fading for 50 through 74', () => {
    expect(freshnessToState(50)).toBe('fading');
    expect(freshnessToState(62)).toBe('fading');
    expect(freshnessToState(74)).toBe('fading');
  });

  it('returns fresh at boundary 75', () => {
    expect(freshnessToState(75)).toBe('fresh');
  });

  it('returns fresh for 75 through 100', () => {
    expect(freshnessToState(75)).toBe('fresh');
    expect(freshnessToState(88)).toBe('fresh');
    expect(freshnessToState(100)).toBe('fresh');
  });

  it('returns fresh for values above 100', () => {
    expect(freshnessToState(101)).toBe('fresh');
    expect(freshnessToState(200)).toBe('fresh');
  });
});

// ---------------------------------------------------------------------------
// computeFreshness
// ---------------------------------------------------------------------------
describe('computeFreshness', () => {
  describe('when dormantSince is non-null', () => {
    it('returns 0% and dormant state regardless of other values', () => {
      const result = computeFreshness(
        new Date(NOW).toISOString(),
        5,
        '2026-01-01T00:00:00.000Z',
      );

      expect(result.percentage).toBe(0);
      expect(result.state).toBe('dormant');
      expect(result.daysUntilDormant).toBe(0);
      expect(result.intervalDays).toBe(60); // reviewCount 5 -> 60
    });

    it('uses correct interval even when dormant', () => {
      const result = computeFreshness(
        new Date(NOW).toISOString(),
        12,
        '2026-01-01T00:00:00.000Z',
      );

      expect(result.intervalDays).toBe(120);
      expect(result.state).toBe('dormant');
    });
  });

  describe('when dormantSince is null (active)', () => {
    it('returns 100% when reviewed just now', () => {
      const result = computeFreshness(
        new Date(NOW).toISOString(),
        0,
        null,
      );

      expect(result.percentage).toBe(100);
      expect(result.state).toBe('fresh');
      expect(result.daysUntilDormant).toBe(14);
      expect(result.intervalDays).toBe(14);
    });

    it('returns 50% when half the interval has elapsed', () => {
      const reviewCount = 0; // interval = 14
      const sevenDaysAgo = new Date(NOW - 7 * MS_PER_DAY).toISOString();
      const result = computeFreshness(sevenDaysAgo, reviewCount, null);

      expect(result.percentage).toBe(50);
      expect(result.state).toBe('fading');
      expect(result.daysUntilDormant).toBe(7);
    });

    it('returns 0% when the full interval has elapsed', () => {
      const reviewCount = 0; // interval = 14
      const fourteenDaysAgo = new Date(NOW - 14 * MS_PER_DAY).toISOString();
      const result = computeFreshness(fourteenDaysAgo, reviewCount, null);

      expect(result.percentage).toBe(0);
      expect(result.state).toBe('dormant');
      expect(result.daysUntilDormant).toBe(0);
    });

    it('returns 0% when more than the interval has elapsed', () => {
      const reviewCount = 0; // interval = 14
      const twentyDaysAgo = new Date(NOW - 20 * MS_PER_DAY).toISOString();
      const result = computeFreshness(twentyDaysAgo, reviewCount, null);

      expect(result.percentage).toBe(0);
      expect(result.state).toBe('dormant');
      expect(result.daysUntilDormant).toBe(0);
    });

    it('floors the percentage correctly', () => {
      // 1 day elapsed, interval = 14
      // freshness = (1 - 1/14) * 100 = 92.857... -> floor -> 92
      const reviewCount = 0;
      const oneDayAgo = new Date(NOW - 1 * MS_PER_DAY).toISOString();
      const result = computeFreshness(oneDayAgo, reviewCount, null);

      expect(result.percentage).toBe(92);
      expect(result.state).toBe('fresh');
    });

    it('computes daysUntilDormant using Math.ceil', () => {
      // 1 day elapsed, interval = 14 -> daysUntilDormant = ceil(14 - 1) = 13
      const reviewCount = 0;
      const oneDayAgo = new Date(NOW - 1 * MS_PER_DAY).toISOString();
      const result = computeFreshness(oneDayAgo, reviewCount, null);

      expect(result.daysUntilDormant).toBe(13);
    });

    it('computes daysUntilDormant as 0 when past interval', () => {
      const reviewCount = 1; // interval = 21
      const thirtyDaysAgo = new Date(NOW - 30 * MS_PER_DAY).toISOString();
      const result = computeFreshness(thirtyDaysAgo, reviewCount, null);

      expect(result.daysUntilDormant).toBe(0);
    });

    it('uses correct interval for higher review counts', () => {
      const reviewCount = 10; // interval = 90
      const fortyFiveDaysAgo = new Date(NOW - 45 * MS_PER_DAY).toISOString();
      const result = computeFreshness(fortyFiveDaysAgo, reviewCount, null);

      // freshness = (1 - 45/90) * 100 = 50
      expect(result.percentage).toBe(50);
      expect(result.state).toBe('fading');
      expect(result.intervalDays).toBe(90);
      expect(result.daysUntilDormant).toBe(45);
    });

    it('clamps percentage to 100 max when lastReviewedAt is in the future', () => {
      const reviewCount = 0;
      const tomorrow = new Date(NOW + 1 * MS_PER_DAY).toISOString();
      const result = computeFreshness(tomorrow, reviewCount, null);

      expect(result.percentage).toBe(100);
      expect(result.state).toBe('fresh');
    });

    it('handles fractional days correctly', () => {
      // 3.5 days elapsed, interval = 14
      // freshness = (1 - 3.5/14) * 100 = 75 -> floor -> 75
      const reviewCount = 0;
      const threeAndHalfDaysAgo = new Date(NOW - 3.5 * MS_PER_DAY).toISOString();
      const result = computeFreshness(threeAndHalfDaysAgo, reviewCount, null);

      expect(result.percentage).toBe(75);
      expect(result.state).toBe('fresh');
    });

    it('returns critical state near the end of the interval', () => {
      // 13 days elapsed, interval = 14
      // freshness = (1 - 13/14) * 100 = 7.14... -> floor -> 7
      const reviewCount = 0;
      const thirteenDaysAgo = new Date(NOW - 13 * MS_PER_DAY).toISOString();
      const result = computeFreshness(thirteenDaysAgo, reviewCount, null);

      expect(result.percentage).toBe(7);
      expect(result.state).toBe('critical');
      expect(result.daysUntilDormant).toBe(1);
    });

    it('returns warning state at appropriate range', () => {
      // Need percentage in [25, 50). With interval=120 (reviewCount=12):
      // 84 days elapsed -> (1 - 84/120)*100 = 30 -> warning
      const reviewCount = 12;
      const eightyFourDaysAgo = new Date(NOW - 84 * MS_PER_DAY).toISOString();
      const result = computeFreshness(eightyFourDaysAgo, reviewCount, null);

      expect(result.percentage).toBe(30);
      expect(result.state).toBe('warning');
    });
  });
});

// ---------------------------------------------------------------------------
// computePoorRevisionTimestamp
// ---------------------------------------------------------------------------
describe('computePoorRevisionTimestamp', () => {
  it('returns a timestamp half the interval in the past', () => {
    const intervalDays = 14;
    const result = computePoorRevisionTimestamp(intervalDays);
    const expectedMs = NOW - (14 / 2) * MS_PER_DAY;

    expect(result).toBe(new Date(expectedMs).toISOString());
  });

  it('returns current time when interval is 0', () => {
    const result = computePoorRevisionTimestamp(0);
    expect(result).toBe(new Date(NOW).toISOString());
  });

  it('works with the standard decay intervals', () => {
    const intervals = [14, 21, 30, 45, 60, 75, 90, 120];

    for (const interval of intervals) {
      const result = computePoorRevisionTimestamp(interval);
      const expectedMs = NOW - (interval / 2) * MS_PER_DAY;
      expect(result).toBe(new Date(expectedMs).toISOString());
    }
  });

  it('produces a timestamp that yields ~50% freshness', () => {
    const reviewCount = 2; // interval = 30
    const intervalDays = getDecayInterval(reviewCount);
    const timestamp = computePoorRevisionTimestamp(intervalDays);
    const result = computeFreshness(timestamp, reviewCount, null);

    expect(result.percentage).toBe(50);
    expect(result.state).toBe('fading');
  });

  it('returns a valid ISO string', () => {
    const result = computePoorRevisionTimestamp(60);
    expect(() => new Date(result)).not.toThrow();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
