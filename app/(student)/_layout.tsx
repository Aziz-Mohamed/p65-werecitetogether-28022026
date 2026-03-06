import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/feedback';

// ─── Student Layout ───────────────────────────────────────────────────────────

export default function StudentLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen name="sessions/index" />
        <Stack.Screen name="sessions/[id]" />
        <Stack.Screen name="programs/[id]" />
        <Stack.Screen name="programs/my-programs" />
        <Stack.Screen name="rub-progress" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="schedule/index" />
        <Stack.Screen name="schedule/[id]" />
        <Stack.Screen name="available-now/[programId]" />
        <Stack.Screen name="certificates/index" />
        <Stack.Screen name="certificates/[id]" />
      </Stack>
    </ErrorBoundary>
  );
}
