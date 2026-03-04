import React from 'react';
import { Stack } from 'expo-router';

export default function ProgramAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="programs/index" />
      <Stack.Screen name="programs/[id]/index" />
      <Stack.Screen name="programs/[id]/tracks" />
      <Stack.Screen name="programs/[id]/cohorts/index" />
      <Stack.Screen name="programs/[id]/cohorts/create" />
      <Stack.Screen name="programs/[id]/cohorts/[cohortId]" />
      <Stack.Screen name="programs/[id]/team" />
    </Stack>
  );
}
