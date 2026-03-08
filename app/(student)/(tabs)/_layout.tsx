import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { CustomTabBar } from '@/components/layout/CustomTabBar';

// ─── Student Tabs Layout ──────────────────────────────────────────────────────
// Order: Dashboard | Programs | Memorization | Revision (center) | Journey | Profile

export default function StudentTabsLayout() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const { showPrompt, activeSession, dismissPrompt } =
    usePostSessionDetection(profile?.id);

  return (
    <View style={{ flex: 1 }}>
      {showPrompt && activeSession && profile?.id && (
        <PostSessionPrompt
          session={activeSession}
          studentId={profile.id}
          onDismiss={dismissPrompt}
        />
      )}
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard.student.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: t('student.tabs.programs'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memorization"
        options={{
          title: t('dashboard.student.programs'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('dashboard.student.progress'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="certificates"
        options={{
          title: t('dashboard.student.certificates'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'ribbon' : 'ribbon-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('dashboard.student.profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}
