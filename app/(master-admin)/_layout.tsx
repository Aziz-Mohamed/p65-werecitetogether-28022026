import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/feedback';

export default function MasterAdminLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="programs/index" />
        <Stack.Screen name="programs/[id]" />
        <Stack.Screen name="users/index" />
        <Stack.Screen name="users/[id]" />
        <Stack.Screen name="reports/index" />
        <Stack.Screen name="settings/index" />
      </Stack>
    </ErrorBoundary>
  );
}
