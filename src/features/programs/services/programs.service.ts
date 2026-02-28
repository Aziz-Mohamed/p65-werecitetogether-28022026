import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { Json } from '@/types/database.types';
import type { Program, ProgramTrack, ProgramWithTracks } from '../types';

class ProgramsService {
  async getPrograms(): Promise<ServiceResult<Program[]>> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async getProgramById(id: string): Promise<ServiceResult<ProgramWithTracks>> {
    const { data, error } = await supabase
      .from('programs')
      .select('*, program_tracks(*)')
      .eq('id', id)
      .eq('program_tracks.is_active', true)
      .order('sort_order', { referencedTable: 'program_tracks' })
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data as ProgramWithTracks };
  }

  async getProgramTracks(programId: string): Promise<ServiceResult<ProgramTrack[]>> {
    const { data, error } = await supabase
      .from('program_tracks')
      .select('*')
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async createProgram(input: {
    name: string;
    name_ar: string;
    description?: string;
    description_ar?: string;
    category: string;
    settings?: Json;
  }): Promise<ServiceResult<Program>> {
    const { data, error } = await supabase
      .from('programs')
      .insert({
        name: input.name,
        name_ar: input.name_ar,
        description: input.description ?? null,
        description_ar: input.description_ar ?? null,
        category: input.category,
        settings: input.settings ?? ({} as Json),
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async updateProgram(
    id: string,
    input: {
      name?: string;
      name_ar?: string;
      description?: string | null;
      description_ar?: string | null;
      category?: string;
      is_active?: boolean;
      settings?: Json;
    },
  ): Promise<ServiceResult<Program>> {
    const { data, error } = await supabase
      .from('programs')
      .update(input as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async createTrack(
    programId: string,
    input: {
      name: string;
      name_ar: string;
      description?: string;
      description_ar?: string;
      track_type?: string;
      curriculum?: Json;
      sort_order?: number;
    },
  ): Promise<ServiceResult<ProgramTrack>> {
    const { data, error } = await supabase
      .from('program_tracks')
      .insert({
        program_id: programId,
        name: input.name,
        name_ar: input.name_ar,
        description: input.description ?? null,
        description_ar: input.description_ar ?? null,
        track_type: input.track_type ?? null,
        curriculum: input.curriculum ?? null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async updateTrack(
    id: string,
    input: {
      name?: string;
      name_ar?: string;
      description?: string | null;
      description_ar?: string | null;
      track_type?: string | null;
      curriculum?: Json;
      sort_order?: number;
      is_active?: boolean;
    },
  ): Promise<ServiceResult<ProgramTrack>> {
    const { data, error } = await supabase
      .from('program_tracks')
      .update(input as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }
}

export const programsService = new ProgramsService();
