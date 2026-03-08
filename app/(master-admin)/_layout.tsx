import React from 'react';
import { Stack } from 'expo-router';

export default function MasterAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="programs/index" />
      <Stack.Screen name="programs/create" />
      <Stack.Screen name="programs/[id]/index" />
    </Stack>
  );
}
