import 'react-native-reanimated';
import 'react-native-gesture-handler';

import React, { useEffect, useState, useCallback } from 'react';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';

import { useAuthStore, type Profile } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useWorkspaceDraftStore } from '@/stores/workspaceDraftStore';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/i18n/config';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useRealtimeManager, useRealtimeReconnect } from '@/features/realtime';
import { useNotificationSetup } from '@/features/notifications/hooks/useNotificationSetup';
import { useNotificationHandler } from '@/features/notifications/hooks/useNotificationHandler';
import { NotificationSoftAsk } from '@/features/notifications/components/NotificationSoftAsk';
import { InAppBanner } from '@/features/notifications/components/InAppBanner';
import type { UserRole as NotifUserRole, NotificationPayload } from '@/features/notifications/types/notifications.types';

// ─── Keep Splash Screen Visible ──────────────────────────────────────────────

SplashScreen.preventAutoHideAsync();

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [storeHydrated, setStoreHydrated] = useState(false);
  const isRTL = useLocaleStore((s) => s.isRTL);

  // Wait for Zustand locale store to hydrate from AsyncStorage,
  // then sync i18n language and native RTL state with the persisted preference.
  useEffect(() => {
    const syncLocale = () => {
      const { locale, isRTL: storedRTL } = useLocaleStore.getState();
      if (i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
      // Sync native I18nManager with persisted locale so that native
      // components (tab bar, navigation) and future app launches are correct.
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
      // Clean up workspace drafts older than 7 days
      useWorkspaceDraftStore.getState().clearStaleDrafts();
    }
  }, [storeHydrated]);

  if (!storeHydrated) {
    return null;
  }

  // `direction` on the root View controls layout for the entire React tree.
  // `I18nManager.forceRTL()` (called above) handles native components outside
  // this tree (tab bar, navigation transitions) and persists for next launch.
  return (
    <GestureHandlerRootView style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

/** Map extended roles to notification-compatible 4-role subset */
function toNotifRole(role: string | null): NotifUserRole {
  if (role === 'student' || role === 'teacher') return role;
  return 'admin'; // all admin-tier roles map to 'admin' for notifications
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, role, profile } = useAuth();

  // ─── Realtime Subscriptions ─────────────────────────────────────────────────
  useRealtimeReconnect();
  useRealtimeManager();

  // ─── Push Notifications ───────────────────────────────────────────────────
  const {
    showSoftAsk,
    dismissSoftAsk,
    requestPermissions,
  } = useNotificationSetup({
    userId: profile?.id,
    isAuthenticated,
  });

  const handleEnableNotifications = async () => {
    dismissSoftAsk();
    await requestPermissions();
  };

  // ─── Notification Handler (tap + foreground) ──────────────────────────────
  const [bannerNotification, setBannerNotification] = useState<NotificationPayload | null>(null);

  const handleForegroundNotification = useCallback((payload: NotificationPayload) => {
    setBannerNotification(payload);
  }, []);

  const { navigateToNotification } = useNotificationHandler({
    isAuthenticated,
    onForegroundNotification: handleForegroundNotification,
  });

  const handleBannerPress = useCallback(
    (payload: NotificationPayload) => {
      setBannerNotification(null);
      navigateToNotification(payload.data);
    },
    [navigateToNotification],
  );

  const handleBannerDismiss = useCallback(() => {
    setBannerNotification(null);
  }, []);
  const initialize = useAuthStore((s) => s.initialize);
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // ─── Initialize Auth Listener ───────────────────────────────────────────────

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Fetch profile
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

    // Listen to auth changes (T116: handle token expiry)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        // Token expired or user signed out — clear auth state
        clearAuth();
        return;
      }
      if (session) {
        // Fetch profile on sign in or token refresh
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
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated) {
      // Not authenticated - redirect to login unless already in auth group
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // Wait for profile to be fetched before routing by role
      if (!profile) {
        return;
      }

      // Check onboarding status — redirect to onboarding if not completed
      const onboardingCompleted = (profile as Record<string, unknown>).onboarding_completed;
      const inOnboarding = (segments as string[])[1] === 'onboarding';
      if (!onboardingCompleted && !inOnboarding) {
        router.replace('/(auth)/onboarding');
        return;
      }

      // Authenticated - redirect to role-based dashboard if in auth group
      if (inAuthGroup && onboardingCompleted) {
        switch (role) {
          case 'student':
            router.replace('/(student)/');
            break;
          case 'teacher':
            router.replace('/(teacher)/');
            break;
          case 'supervisor':
            router.replace('/(supervisor)/');
            break;
          case 'program_admin':
            router.replace('/(program-admin)/');
            break;
          case 'master_admin':
            router.replace('/(master-admin)/');
            break;
          default:
            router.replace('/(auth)/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, role, profile, segments, router]);

  return (
    <>
      {children}
      <NotificationSoftAsk
        visible={showSoftAsk && isAuthenticated && !!profile}
        role={toNotifRole(role)}
        onEnable={handleEnableNotifications}
        onDismiss={dismissSoftAsk}
      />
      <InAppBanner
        notification={bannerNotification}
        onPress={handleBannerPress}
        onDismiss={handleBannerDismiss}
      />
    </>
  );
}
