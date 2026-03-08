import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/feedback';

export default function TeacherLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sessions/[id]" />
        <Stack.Screen name="awards/index" />
        <Stack.Screen name="students/[id]" />
        <Stack.Screen name="students/top-performers" />
        <Stack.Screen name="students/needs-support" />
        <Stack.Screen name="schedule/index" />
        <Stack.Screen name="schedule/[id]/index" />
        <Stack.Screen name="schedule/[id]/workspace" />
        <Stack.Screen name="availability" />
        <Stack.Screen name="mutoon/[trackId]" />
      </Stack>
    </ErrorBoundary>
  );
}
