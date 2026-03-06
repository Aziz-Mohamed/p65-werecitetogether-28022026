import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { useTimePeriod } from './useTimePeriod';

// Minimal renderHook (React 19 compatible)
function renderHook<T>(hookFn: () => T) {
  const result = { current: null as T };
  function TestComponent() {
    result.current = hookFn();
    return null;
  }
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(React.createElement(TestComponent));
  });
  return { result, unmount: () => act(() => renderer.unmount()) };
}

describe('useTimePeriod', () => {
  it('starts with "this_month" as default period', () => {
    const { result } = renderHook(() => useTimePeriod());
    expect(result.current.timePeriod).toBe('this_month');
  });

  it('returns a dateRange with startDate and endDate', () => {
    const { result } = renderHook(() => useTimePeriod());
    expect(result.current.dateRange.startDate).toBeDefined();
    expect(result.current.dateRange.endDate).toBeDefined();
    expect(result.current.dateRange.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('updates period via setTimePeriod', () => {
    const { result } = renderHook(() => useTimePeriod());

    act(() => {
      result.current.setTimePeriod('this_week');
    });

    expect(result.current.timePeriod).toBe('this_week');
  });

  it('dateRange changes when timePeriod changes', () => {
    const { result } = renderHook(() => useTimePeriod());
    const monthRange = { ...result.current.dateRange };

    act(() => {
      result.current.setTimePeriod('this_week');
    });

    // Week range should be different from month range
    expect(result.current.dateRange.startDate).not.toBe(monthRange.startDate);
  });
});
