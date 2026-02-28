import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/feedback';

export default function TeacherLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ErrorBoundary>
  );
}
