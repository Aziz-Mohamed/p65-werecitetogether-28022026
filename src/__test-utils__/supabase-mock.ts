/**
 * Helpers for resetting and configuring the global supabase mock
 * defined in jest.setup.ts.
 */
import { supabase } from '@/lib/supabase';

const mock = supabase as unknown as {
  from: jest.Mock;
  rpc: jest.Mock;
  auth: {
    getUser: jest.Mock;
    getSession: jest.Mock;
    signOut: jest.Mock;
    refreshSession: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
};

/**
 * Creates a chainable query builder mock that resolves to { data, error }.
 * All intermediate methods (select, eq, etc.) return the same builder.
 * The builder itself is a thenable that resolves to the configured response.
 */
export function createQueryMock(response: { data: any; error: any } = { data: null, error: null }) {
  const builder: Record<string, any> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'or', 'not', 'filter', 'match',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'throwOnError',
  ];
  for (const m of methods) {
    builder[m] = jest.fn().mockReturnValue(builder);
  }
  // Make the builder thenable so `await` resolves to the response
  builder.then = (resolve: (v: any) => any) => resolve(response);
  return builder;
}

/** Get the mocked `supabase.from` */
export function mockFrom() {
  return mock.from;
}

/** Get the mocked `supabase.rpc` */
export function mockRpc() {
  return mock.rpc;
}

/** Get the mocked `supabase.auth` */
export function mockAuth() {
  return mock.auth;
}

/**
 * Configure `supabase.from(tableName)` to return a specific query builder.
 * If tableName is not provided, ALL from() calls return this builder.
 */
export function whenFrom(tableName?: string) {
  return {
    thenReturn(response: { data: any; error: any }) {
      const builder = createQueryMock(response);
      if (tableName) {
        mock.from.mockImplementation((table: string) => {
          if (table === tableName) return builder;
          return createQueryMock({ data: null, error: null });
        });
      } else {
        mock.from.mockReturnValue(builder);
      }
      return builder;
    },
  };
}

/**
 * Configure `supabase.from()` to return different responses per table.
 */
export function whenFromMulti(config: Record<string, { data: any; error: any }>) {
  const builders: Record<string, any> = {};
  for (const [table, response] of Object.entries(config)) {
    builders[table] = createQueryMock(response);
  }

  mock.from.mockImplementation((table: string) => {
    return builders[table] ?? createQueryMock({ data: null, error: null });
  });

  return builders;
}

/**
 * Configure `supabase.rpc()` to resolve with the given response.
 */
export function whenRpc(response: { data: any; error: any }) {
  mock.rpc.mockResolvedValue(response);
}

/**
 * Configure `supabase.auth.getUser()` to return a user.
 */
export function whenGetUser(user: { id: string } | null) {
  mock.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
}

/**
 * Reset all supabase mocks to clean state.
 */
export function resetSupabaseMocks() {
  mock.from.mockReset();
  mock.from.mockImplementation(() => createQueryMock());
  mock.rpc.mockReset();
  mock.rpc.mockResolvedValue({ data: null, error: null });
  mock.auth.getUser.mockReset();
  mock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mock.auth.getSession.mockReset();
  mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mock.auth.signOut.mockReset();
  mock.auth.signOut.mockResolvedValue({ error: null });
  mock.auth.refreshSession.mockReset();
  mock.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: null });
}
