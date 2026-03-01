import { supabase } from '@/lib/supabase';
import type { RequestPairingInput } from '../types/peer-pairing.types';

class PeerPairingService {
  async getActivePairings(studentId: string, programId: string) {
    return supabase
      .from('peer_pairings')
      .select(
        '*, student_a:profiles!peer_pairings_student_a_id_fkey(full_name, display_name, avatar_url, meeting_link), student_b:profiles!peer_pairings_student_b_id_fkey(full_name, display_name, avatar_url, meeting_link)',
      )
      .eq('program_id', programId)
      .in('status', ['pending', 'active'])
      .or(`student_a_id.eq.${studentId},student_b_id.eq.${studentId}`)
      .order('created_at', { ascending: false });
  }

  async getPairingById(pairingId: string) {
    return supabase
      .from('peer_pairings')
      .select(
        '*, student_a:profiles!peer_pairings_student_a_id_fkey(full_name, display_name, avatar_url, meeting_link), student_b:profiles!peer_pairings_student_b_id_fkey(full_name, display_name, avatar_url, meeting_link)',
      )
      .eq('id', pairingId)
      .single();
  }

  async getAvailablePartners(programId: string, sectionType: string, excludeStudentId: string) {
    // Get students enrolled in this program who are peer_available
    // and not already in an active/pending pairing for the same section_type
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url')
      .eq('peer_available', true)
      .neq('id', excludeStudentId)
      .order('full_name', { ascending: true });

    if (error) return { data: null, error };

    // Filter out students already in active/pending pairings for this section type
    const { data: existingPairings } = await supabase
      .from('peer_pairings')
      .select('student_a_id, student_b_id')
      .eq('program_id', programId)
      .eq('section_type', sectionType)
      .in('status', ['pending', 'active']);

    const pairedStudentIds = new Set<string>();
    for (const p of existingPairings ?? []) {
      pairedStudentIds.add(p.student_a_id);
      pairedStudentIds.add(p.student_b_id);
    }

    return {
      data: (profiles ?? []).filter((p) => !pairedStudentIds.has(p.id)),
      error: null,
    };
  }

  async togglePeerAvailability(studentId: string, available: boolean) {
    return supabase
      .from('profiles')
      .update({ peer_available: available })
      .eq('id', studentId)
      .select()
      .single();
  }

  async getPairingHistory(studentId: string, programId: string) {
    return supabase
      .from('peer_pairings')
      .select(
        '*, student_a:profiles!peer_pairings_student_a_id_fkey(full_name, display_name), student_b:profiles!peer_pairings_student_b_id_fkey(full_name, display_name)',
      )
      .eq('program_id', programId)
      .or(`student_a_id.eq.${studentId},student_b_id.eq.${studentId}`)
      .order('created_at', { ascending: false });
  }

  async requestPairing(input: RequestPairingInput) {
    return supabase
      .from('peer_pairings')
      .insert({ ...input, status: 'pending' })
      .select()
      .single();
  }

  async respondToPairing(pairingId: string, action: 'accept' | 'decline') {
    return supabase
      .from('peer_pairings')
      .update({ status: action === 'accept' ? 'active' : 'cancelled' })
      .eq('id', pairingId)
      .select()
      .single();
  }

  async logPairingSession(pairingId: string) {
    // Increment session_count
    const { data: pairing, error: fetchError } = await supabase
      .from('peer_pairings')
      .select('session_count')
      .eq('id', pairingId)
      .single();

    if (fetchError) return { data: null, error: fetchError };

    return supabase
      .from('peer_pairings')
      .update({ session_count: (pairing?.session_count ?? 0) + 1 })
      .eq('id', pairingId)
      .select()
      .single();
  }

  async completePairing(pairingId: string) {
    return supabase
      .from('peer_pairings')
      .update({ status: 'completed' })
      .eq('id', pairingId)
      .select()
      .single();
  }

  async cancelPairing(pairingId: string) {
    return supabase
      .from('peer_pairings')
      .update({ status: 'cancelled' })
      .eq('id', pairingId)
      .select()
      .single();
  }
}

export const peerPairingService = new PeerPairingService();
