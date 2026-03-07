import { supabase } from '@/lib/supabase';
import type { UpdateProfileInput } from '../types/profile.types';

class ProfileService {
  /**
   * PS-001: Get the current user's profile by ID.
   */
  async getProfile(userId: string) {
    return supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  }

  /**
   * PS-002: Get a profile with role-specific nested data.
   * Students: includes student record + class.
   * Teachers: includes classes.
   * Parents: includes children.
   */
  async getProfileWithDetails(userId: string) {
    return supabase
      .from('profiles')
      .select(
        '*, students!students_id_fkey(*, classes(id, name, name_localized)), classes!classes_teacher_id_fkey(id, name, name_localized)',
      )
      .eq('id', userId)
      .single();
  }

  /**
   * PS-003: Update profile fields (name, phone, avatar, language, username).
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const updates: Record<string, unknown> = {};

    if (input.full_name !== undefined) updates.full_name = input.full_name;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.avatar_url !== undefined) updates.avatar_url = input.avatar_url;
    if (input.preferred_language !== undefined) updates.preferred_language = input.preferred_language;
    if (input.username !== undefined) updates.username = input.username;

    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  }

  /**
   * PS-004: Update meeting link and platform (for teachers).
   */
  async updateMeetingLink(userId: string, meetingLink: string | null, meetingPlatform: string | null) {
    return supabase
      .from('profiles')
      .update({
        meeting_link: meetingLink,
        meeting_platform: meetingPlatform,
      })
      .eq('id', userId)
      .select()
      .single();
  }

  /**
   * PS-005: Upload avatar and update profile with the new URL.
   * Returns the public URL of the uploaded avatar.
   */
  async uploadAvatar(userId: string, fileBase64: string, fileExt: string) {
    const filePath = `${userId}/avatar.${fileExt}`;
    const decoded = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decoded, {
        upsert: true,
        contentType: `image/${fileExt}`,
      });

    if (uploadError) return { data: null, error: uploadError };

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const timestamped = `${urlData.publicUrl}?t=${Date.now()}`;

    return this.updateProfile(userId, { avatar_url: timestamped });
  }

  /**
   * PS-006: Get guardians for a student.
   */
  async getStudentGuardians(studentId: string) {
    return supabase
      .from('student_guardians')
      .select('*')
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false });
  }

  /**
   * PS-007: Add a guardian for a student.
   */
  async addGuardian(input: {
    studentId: string;
    guardianName: string;
    guardianPhone?: string;
    guardianEmail?: string;
    relationship?: string;
    isPrimary?: boolean;
  }) {
    return supabase
      .from('student_guardians')
      .insert({
        student_id: input.studentId,
        guardian_name: input.guardianName,
        guardian_phone: input.guardianPhone ?? null,
        guardian_email: input.guardianEmail ?? null,
        relationship: input.relationship ?? 'parent',
        is_primary: input.isPrimary ?? false,
      })
      .select()
      .single();
  }
}

export const profileService = new ProfileService();
