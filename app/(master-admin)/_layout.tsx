import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/feedback';

export default function MasterAdminLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        {/* User management */}
        <Stack.Screen name="users/index" />
        <Stack.Screen name="users/[id]" />
        {/* Programs */}
        <Stack.Screen name="programs/index" />
        <Stack.Screen name="programs/create" />
        <Stack.Screen name="programs/[id]/index" />
        <Stack.Screen name="programs/[id]/edit" />
        <Stack.Screen name="programs/[id]/team" />
        <Stack.Screen name="programs/[id]/tracks" />
        <Stack.Screen name="programs/[id]/cohorts/index" />
        <Stack.Screen name="programs/[id]/cohorts/[cohortId]" />
        {/* Certifications */}
        <Stack.Screen name="certifications/index" />
        <Stack.Screen name="certifications/[id]" />
        {/* Reports */}
        <Stack.Screen name="reports/index" />
        <Stack.Screen name="reports/platform" />
        <Stack.Screen name="reports/teacher-activity" />
        <Stack.Screen name="reports/teacher-attendance" />
        <Stack.Screen name="reports/session-completion" />
        <Stack.Screen name="reports/memorization" />
        {/* Settings */}
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/permissions" />
        {/* Students */}
        <Stack.Screen name="students/index" />
        <Stack.Screen name="students/create" />
        <Stack.Screen name="students/[id]/index" />
        <Stack.Screen name="students/[id]/edit" />
        {/* Teachers */}
        <Stack.Screen name="teachers/index" />
        <Stack.Screen name="teachers/create" />
        <Stack.Screen name="teachers/[id]/index" />
        <Stack.Screen name="teachers/[id]/edit" />
        {/* Parents */}
        <Stack.Screen name="parents/index" />
        <Stack.Screen name="parents/create" />
        <Stack.Screen name="parents/[id]/index" />
        <Stack.Screen name="parents/[id]/edit" />
        {/* Classes */}
        <Stack.Screen name="classes/index" />
        <Stack.Screen name="classes/create" />
        <Stack.Screen name="classes/[id]/index" />
        <Stack.Screen name="classes/[id]/edit" />
        <Stack.Screen name="classes/[id]/schedule" />
        {/* Attendance */}
        <Stack.Screen name="attendance/index" />
        {/* Members */}
        <Stack.Screen name="members/reset-password" />
        <Stack.Screen name="members/edit-role" />
        {/* Stickers */}
        <Stack.Screen name="stickers/index" />
        <Stack.Screen name="stickers/create" />
        <Stack.Screen name="stickers/[id]/edit" />
      </Stack>
    </ErrorBoundary>
  );
}
