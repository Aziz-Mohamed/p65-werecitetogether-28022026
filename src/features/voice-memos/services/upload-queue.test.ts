jest.mock('./voice-memo.service', () => ({
  voiceMemoService: {
    uploadMemo: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadQueue } from './upload-queue';
import { voiceMemoService } from './voice-memo.service';

const mockUpload = voiceMemoService.uploadMemo as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockUpload.mockReset();
  // Reset the processing flag by creating a fresh import
  // (uploadQueue is a singleton, so we reset its internal state indirectly)
});

describe('UploadQueue', () => {
  describe('getQueue', () => {
    it('returns empty array when nothing stored', async () => {
      const queue = await uploadQueue.getQueue();
      expect(queue).toEqual([]);
    });

    it('returns parsed items from storage', async () => {
      const items = [{ sessionId: 's1', fileUri: '/file.m4a', durationSeconds: 30 }];
      await AsyncStorage.setItem('voice-memo-upload-queue', JSON.stringify(items));

      const queue = await uploadQueue.getQueue();
      expect(queue).toEqual(items);
    });

    it('handles invalid JSON gracefully', async () => {
      await AsyncStorage.setItem('voice-memo-upload-queue', 'not-json');

      const queue = await uploadQueue.getQueue();
      expect(queue).toEqual([]);
    });
  });

  describe('add', () => {
    it('appends item to the queue', async () => {
      await uploadQueue.add({
        sessionId: 's1',
        fileUri: '/file1.m4a',
        durationSeconds: 30,
      });
      await uploadQueue.add({
        sessionId: 's2',
        fileUri: '/file2.m4a',
        durationSeconds: 60,
      });

      const queue = await uploadQueue.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].sessionId).toBe('s1');
      expect(queue[1].sessionId).toBe('s2');
    });
  });

  describe('remove', () => {
    it('removes item by sessionId', async () => {
      await uploadQueue.add({ sessionId: 's1', fileUri: '/f1', durationSeconds: 10 });
      await uploadQueue.add({ sessionId: 's2', fileUri: '/f2', durationSeconds: 20 });

      await uploadQueue.remove('s1');

      const queue = await uploadQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].sessionId).toBe('s2');
    });
  });

  describe('retryAll', () => {
    it('uploads each item and removes successful ones', async () => {
      await uploadQueue.add({ sessionId: 's1', fileUri: '/f1', durationSeconds: 10 });
      await uploadQueue.add({ sessionId: 's2', fileUri: '/f2', durationSeconds: 20 });

      mockUpload.mockResolvedValue({ error: null });

      const result = await uploadQueue.retryAll();

      expect(result).toEqual({ succeeded: 2, failed: 0 });
      expect(mockUpload).toHaveBeenCalledTimes(2);

      const remaining = await uploadQueue.getQueue();
      expect(remaining).toHaveLength(0);
    });

    it('keeps failed items in queue', async () => {
      await uploadQueue.add({ sessionId: 's1', fileUri: '/f1', durationSeconds: 10 });
      await uploadQueue.add({ sessionId: 's2', fileUri: '/f2', durationSeconds: 20 });

      mockUpload
        .mockResolvedValueOnce({ error: null }) // s1 succeeds
        .mockResolvedValueOnce({ error: { message: 'upload failed' } }); // s2 fails

      const result = await uploadQueue.retryAll();

      expect(result).toEqual({ succeeded: 1, failed: 1 });

      const remaining = await uploadQueue.getQueue();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].sessionId).toBe('s2');
    });

    it('returns {0, 0} when queue is empty', async () => {
      mockUpload.mockResolvedValue({ error: null });

      const result = await uploadQueue.retryAll();
      expect(result).toEqual({ succeeded: 0, failed: 0 });
      expect(mockUpload).not.toHaveBeenCalled();
    });
  });
});
