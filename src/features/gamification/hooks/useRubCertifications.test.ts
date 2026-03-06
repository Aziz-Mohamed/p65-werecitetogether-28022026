/**
 * Tests for the enrichment and aggregation logic in useRubCertifications.
 * Tests the pure computation extracted from the hook's useMemo blocks.
 */
import { computeFreshness } from '../utils/freshness';
import type { EnrichedCertification, RubCertification } from '../types/gamification.types';

// Extract the enrichment logic from the hook for testing
function enrichCertifications(certs: RubCertification[]): EnrichedCertification[] {
  return certs.map((cert) => ({
    ...cert,
    freshness: computeFreshness(cert.last_reviewed_at, cert.review_count, cert.dormant_since),
  }));
}

function buildCertMap(enriched: EnrichedCertification[]): Map<number, EnrichedCertification> {
  const map = new Map<number, EnrichedCertification>();
  for (const cert of enriched) {
    map.set(cert.rub_number, cert);
  }
  return map;
}

function makeCert(overrides: Partial<RubCertification> = {}): RubCertification {
  return {
    id: 'cert-1',
    student_id: 's1',
    rub_number: 1,
    certified_by: 't1',
    certified_at: '2026-01-01T00:00:00Z',
    review_count: 3,
    last_reviewed_at: new Date().toISOString(),
    dormant_since: null,
    profiles: { full_name: 'Teacher' },
    ...overrides,
  } as RubCertification;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-01T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useRubCertifications enrichment', () => {
  it('enriches each certification with freshness data', () => {
    const certs = [makeCert({ rub_number: 1 })];
    const enriched = enrichCertifications(certs);

    expect(enriched).toHaveLength(1);
    expect(enriched[0].freshness).toBeDefined();
    expect(enriched[0].freshness.percentage).toBeGreaterThanOrEqual(0);
    expect(enriched[0].freshness.state).toBeDefined();
  });

  it('dormant certifications get freshness state "dormant"', () => {
    const certs = [makeCert({ dormant_since: '2026-01-01T00:00:00Z' })];
    const enriched = enrichCertifications(certs);

    expect(enriched[0].freshness.state).toBe('dormant');
    expect(enriched[0].freshness.percentage).toBe(0);
  });

  it('recently reviewed certifications are fresh', () => {
    const certs = [makeCert({ last_reviewed_at: '2026-02-28T00:00:00Z', review_count: 5 })];
    const enriched = enrichCertifications(certs);

    expect(enriched[0].freshness.state).toBe('fresh');
    expect(enriched[0].freshness.percentage).toBeGreaterThan(90);
  });
});

describe('certMap construction', () => {
  it('creates a map keyed by rub_number', () => {
    const certs = [
      makeCert({ rub_number: 1 }),
      makeCert({ rub_number: 5, id: 'cert-5' }),
      makeCert({ rub_number: 10, id: 'cert-10' }),
    ];
    const enriched = enrichCertifications(certs);
    const map = buildCertMap(enriched);

    expect(map.size).toBe(3);
    expect(map.get(1)!.id).toBe('cert-1');
    expect(map.get(5)!.id).toBe('cert-5');
    expect(map.get(10)!.id).toBe('cert-10');
    expect(map.get(99)).toBeUndefined();
  });
});

describe('derived counts', () => {
  it('computes activeCount (not dormant)', () => {
    const certs = [
      makeCert({ rub_number: 1, dormant_since: null }),
      makeCert({ rub_number: 2, dormant_since: '2026-01-01T00:00:00Z', id: 'c2' }),
      makeCert({ rub_number: 3, dormant_since: null, id: 'c3' }),
    ];
    const enriched = enrichCertifications(certs);
    const activeCount = enriched.filter((c) => c.freshness.state !== 'dormant').length;

    expect(activeCount).toBe(2);
  });

  it('computes dormantCount', () => {
    const certs = [
      makeCert({ rub_number: 1, dormant_since: '2026-01-01T00:00:00Z' }),
      makeCert({ rub_number: 2, dormant_since: null, id: 'c2' }),
    ];
    const enriched = enrichCertifications(certs);
    const dormantCount = enriched.filter((c) => c.freshness.state === 'dormant').length;

    expect(dormantCount).toBe(1);
  });

  it('computes criticalCount (critical + warning)', () => {
    // Create a cert that was reviewed 40 days ago with review_count=3 (interval=45 days)
    // Freshness = (1 - 40/45) * 100 ≈ 11% → 'critical'
    const certs = [
      makeCert({
        rub_number: 1,
        review_count: 3,
        last_reviewed_at: '2026-01-20T00:00:00Z',
      }),
    ];
    const enriched = enrichCertifications(certs);
    const criticalCount = enriched.filter(
      (c) => c.freshness.state === 'critical' || c.freshness.state === 'warning',
    ).length;

    expect(criticalCount).toBe(1);
  });
});
