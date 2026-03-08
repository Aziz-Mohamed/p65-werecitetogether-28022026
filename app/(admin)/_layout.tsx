import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/feedback';

// ─── Admin Layout ─────────────────────────────────────────────────────────────

export default function AdminLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="students/index" />
        <Stack.Screen name="students/create" />
        <Stack.Screen name="students/[id]/index" />
        <Stack.Screen name="students/[id]/edit" />
        <Stack.Screen name="teachers/index" />
        <Stack.Screen name="teachers/create" />
        <Stack.Screen name="teachers/[id]/index" />
        <Stack.Screen name="teachers/[id]/edit" />
        <Stack.Screen name="parents/index" />
        <Stack.Screen name="parents/create" />
        <Stack.Screen name="parents/[id]/index" />
        <Stack.Screen name="parents/[id]/edit" />
        <Stack.Screen name="classes/index" />
        <Stack.Screen name="classes/create" />
        <Stack.Screen name="classes/[id]/index" />
        <Stack.Screen name="classes/[id]/edit" />
        <Stack.Screen name="classes/[id]/schedule" />
        <Stack.Screen name="attendance/index" />
        <Stack.Screen name="members/reset-password" />
        <Stack.Screen name="members/edit-role" />
        <Stack.Screen name="stickers/index" />
        <Stack.Screen name="stickers/create" />
        <Stack.Screen name="stickers/[id]/edit" />
        <Stack.Screen name="reports/index" />
        <Stack.Screen name="reports/teacher-activity" />
        <Stack.Screen name="reports/teacher-attendance" />
        <Stack.Screen name="reports/session-completion" />
        <Stack.Screen name="settings/permissions" />
      </Stack>
    </ErrorBoundary>
  );
}
