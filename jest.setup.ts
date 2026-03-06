// ─── Global Mocks ──────────────────────────────────────────────────────────

// Mock Supabase client — must be mocked before any service/hook import
// because src/lib/supabase.ts throws at import time without env vars.
jest.mock('@/lib/supabase', () => {
  const chainable = () => {
    const chain: Record<string, jest.Mock> = {};
    const methods = [
      'select', 'insert', 'update', 'delete', 'upsert',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
      'is', 'in', 'or', 'not', 'filter', 'match',
      'order', 'limit', 'range', 'single', 'maybeSingle',
      'csv', 'returns', 'throwOnError',
    ];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    // Terminal — resolves to { data, error }
    chain.then = undefined as any;
    (chain as any)[Symbol.toStringTag] = 'PostgrestFilterBuilder';
    return chain;
  };

  const mockFrom = jest.fn().mockImplementation(() => chainable());
  const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
  const mockChannel = jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  });
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        refreshSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      },
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
