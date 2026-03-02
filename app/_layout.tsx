import 'react-native-reanimated';
import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';

import { useAuthStore, type Profile } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/i18n/config';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { UserRole } from '@/types/common.types';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'wrt-query-cache',
});

// ─── Keep Splash Screen Visible ──────────────────────────────────────────────

SplashScreen.preventAutoHideAsync();

// ─── Role → Route Group Mapping ──────────────────────────────────────────────

const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/(student)/',
  teacher: '/(teacher)/',
  supervisor: '/(supervisor)/',
  program_admin: '/(program-admin)/',
  master_admin: '/(master-admin)/',
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [storeHydrated, setStoreHydrated] = useState(false);
  const isRTL = useLocaleStore((s) => s.isRTL);

  useEffect(() => {
    const syncLocale = () => {
      const { locale, isRTL: storedRTL } = useLocaleStore.getState();
      if (i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
      if (I18nManager.isRTL !== storedRTL) {
        I18nManager.allowRTL(storedRTL);
        I18nManager.forceRTL(storedRTL);
      }
      setStoreHydrated(true);
    };

    if (useLocaleStore.persist.hasHydrated()) {
      syncLocale();
    } else {
      const unsub = useLocaleStore.persist.onFinishHydration(syncLocale);
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (storeHydrated) {
      SplashScreen.hideAsync();
    }
  }, [storeHydrated]);

  if (!storeHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
        <I18nextProvider i18n={i18n}>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(student)" />
              <Stack.Screen name="(teacher)" />
              <Stack.Screen name="(supervisor)" />
              <Stack.Screen name="(program-admin)" />
              <Stack.Screen name="(master-admin)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGuard>
        </I18nextProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, role, profile, onboardingCompleted } = useAuth();

  const initialize = useAuthStore((s) => s.initialize);
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // ─── Initialize Auth Listener ───────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setProfile(data as Profile);
            }
            initialize();
          });
      } else {
        initialize();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        clearAuth();
        return;
      }
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setProfile(data as Profile);
            }
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, initialize, clearAuth]);

  // ─── Auth Guard Logic ────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (!profile) return;

      if (inAuthGroup) {
        if (!onboardingCompleted) {
          router.replace('/(auth)/onboarding');
          return;
        }

        const route = role ? ROLE_ROUTES[role] : null;
        if (route) {
          router.replace(route as any);
        } else {
          router.replace('/(auth)/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, role, profile, onboardingCompleted, segments, router]);

  return <>{children}</>;
}
