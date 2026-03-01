import type { Tables } from '@/types/database.types';

// ─── Enums ──────────────────────────────────────────────────────────────────

export type PeerPairingStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type SectionType = 'quran' | 'mutoon';

// ─── Database Row Alias ─────────────────────────────────────────────────────

export type PeerPairing = Tables<'peer_pairings'>;

// ─── Joined Types ───────────────────────────────────────────────────────────

export interface PeerPairingWithPartners extends PeerPairing {
  student_a: Pick<
    Tables<'profiles'>,
    'full_name' | 'display_name' | 'avatar_url' | 'meeting_link'
  >;
  student_b: Pick<
    Tables<'profiles'>,
    'full_name' | 'display_name' | 'avatar_url' | 'meeting_link'
  >;
}

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface RequestPairingInput {
  program_id: string;
  section_type: SectionType;
  student_a_id: string;
  student_b_id: string;
}
