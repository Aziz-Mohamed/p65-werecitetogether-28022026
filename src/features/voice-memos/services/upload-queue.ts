import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { voiceMemoService } from './voice-memo.service';
import type { UploadQueueItem } from '../types/voice-memo.types';

const QUEUE_KEY = 'voice-memo-upload-queue';

class UploadQueue {
  private processing = false;

  async getQueue(): Promise<UploadQueueItem[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async add(item: UploadQueueItem): Promise<void> {
    const queue = await this.getQueue();
    queue.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async remove(sessionId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((item) => item.sessionId !== sessionId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  async retryAll(): Promise<{ succeeded: number; failed: number }> {
    if (this.processing) return { succeeded: 0, failed: 0 };
    this.processing = true;

    const queue = await this.getQueue();
    let succeeded = 0;
    let failed = 0;

    for (const item of queue) {
      const { error } = await voiceMemoService.uploadMemo(
        item.sessionId,
        item.fileUri,
        item.durationSeconds,
      );

      if (!error) {
        await this.remove(item.sessionId);
        succeeded++;
      } else {
        failed++;
      }
    }

    this.processing = false;
    return { succeeded, failed };
  }
}

export const uploadQueue = new UploadQueue();

/**
 * Hook to monitor and retry the upload queue.
 * Retries pending uploads when app comes to foreground.
 */
export function useUploadQueue() {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const queue = await uploadQueue.getQueue();
    setPendingCount(queue.length);
  }, []);

  const retryAll = useCallback(async () => {
    const result = await uploadQueue.retryAll();
    await refreshCount();
    return result;
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        uploadQueue.retryAll().then(() => refreshCount());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshCount]);

  return { pendingCount, retryAll };
}
