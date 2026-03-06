import React from 'react';
import { Stack } from 'expo-router';

export default function SupervisorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="teachers/[id]/index" />
      <Stack.Screen name="teachers/[id]/students" />
      <Stack.Screen name="certifications/index" />
      <Stack.Screen name="certifications/[id]" />
      <Stack.Screen name="himam/index" />
      <Stack.Screen name="himam/[eventId]/registrations" />
      <Stack.Screen name="himam/[eventId]/pairings" />
    </Stack>
  );
}
