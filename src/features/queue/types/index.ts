import type { Tables } from '@/types/database.types';

export type QueueEntry = Tables<'free_program_queue'>;
export type DailySessionCount = Tables<'daily_session_count'>;

export type QueueStatus = 'waiting' | 'notified' | 'claimed' | 'expired' | 'cancelled';
