import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { RoleSubscriptionProfile, RealtimeStatus } from '../types/realtime.types';
import {
  buildStudentProfile,
  buildTeacherProfile,
  buildParentProfile,
  buildAdminProfile,
} from '../config/subscription-profiles';
import { useRealtimeSubscription } from './useRealtimeSubscription';

/**
 * Fetches the role-specific context needed to build a subscription profile,
 * then delegates to useRealtimeSubscription.
 *
 * - Student: needs class_id from student record
 * - Teacher: needs assigned class_ids
 * - Parent: needs linked child_ids
 * - Admin: uses school_id directly
 *
 * Skips subscription setup if profile/role is not yet available.
 */
export function useRealtimeManager(): RealtimeStatus {
  const { profile, role, schoolId } = useAuth();
  const userId = profile?.id ?? null;

  // Fetch role-specific context
  const { data: roleContext } = useQuery({
    queryKey: ['realtime-context', userId, role],
    queryFn: async () => {
      if (!userId || !role || !schoolId) return null;

      switch (role) {
        case 'student': {
          const { data } = await supabase
            .from('students')
            .select('id, class_id')
            .eq('id', userId)
            .single();
          return data ? { studentId: data.id, classId: data.class_id } : null;
        }
        case 'teacher': {
          const { data } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', userId);
          return { classIds: (data ?? []).map((c) => c.id) };
        }
        case 'parent': {
          const { data } = await supabase
            .from('students')
            .select('id')
            .eq('parent_id', userId)
            .eq('is_active', true);
          return { childIds: (data ?? []).map((s) => s.id) };
        }
        case 'master_admin':
          return {};
        default:
          return null;
      }
    },
    enabled: !!userId && !!role && !!schoolId,
    staleTime: Infinity, // Only refetch when key changes
  });

  // Build subscription profile from auth + role context
  const subscriptionProfile = useMemo((): RoleSubscriptionProfile | null => {
    if (!role || !schoolId || !userId || !roleContext) return null;

    switch (role) {
      case 'student': {
        const ctx = roleContext as { studentId: string; classId: string | null };
        return buildStudentProfile(ctx.studentId, ctx.classId);
      }
      case 'teacher': {
        const ctx = roleContext as { classIds: string[] };
        return buildTeacherProfile(userId, schoolId, ctx.classIds);
      }
      case 'parent': {
        const ctx = roleContext as { childIds: string[] };
        return buildParentProfile(userId, ctx.childIds);
      }
      case 'master_admin':
        return buildAdminProfile(schoolId);
      default:
        return null;
    }
  }, [role, schoolId, userId, roleContext]);

  return useRealtimeSubscription(subscriptionProfile);
}
