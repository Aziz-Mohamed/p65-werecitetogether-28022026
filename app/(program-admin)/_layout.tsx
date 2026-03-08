import React from 'react';
import { Stack } from 'expo-router';

export default function ProgramAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="select" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="team/add" />
      {/* Existing program management screens */}
      <Stack.Screen name="programs/index" />
      <Stack.Screen name="programs/[id]/index" />
      <Stack.Screen name="programs/[id]/tracks" />
      <Stack.Screen name="programs/[id]/classes/index" />
      <Stack.Screen name="programs/[id]/classes/create" />
      <Stack.Screen name="programs/[id]/classes/[classId]" />
      <Stack.Screen name="programs/[id]/team" />
      <Stack.Screen name="students/[id]/index" />
      <Stack.Screen name="certifications/index" />
      <Stack.Screen name="certifications/[id]" />
      <Stack.Screen name="rewards/index" />
      <Stack.Screen name="waitlist/[classId]" />
      <Stack.Screen name="wiki" />
    </Stack>
  );
}
