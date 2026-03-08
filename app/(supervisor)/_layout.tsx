import React from 'react';
import { Stack } from 'expo-router';

export default function SupervisorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="teachers/[id]/index" />
      <Stack.Screen name="teachers/[id]/students" />
    </Stack>
  );
}
