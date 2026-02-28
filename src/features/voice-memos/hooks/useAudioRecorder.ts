import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

const MAX_DURATION_MS = 120_000; // 120 seconds

interface AudioRecorderState {
  isRecording: boolean;
  durationMs: number;
  uri: string | null;
  error: string | null;
}

export function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    durationMs: 0,
    uri: null,
    error: null,
  });

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setState((s) => ({ ...s, error: 'Microphone permission denied' }));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        isMeteringEnabled: false,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        web: {},
      });

      await recording.startAsync();
      recordingRef.current = recording;

      setState({ isRecording: true, durationMs: 0, uri: null, error: null });

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= MAX_DURATION_MS) {
          stopRecording();
        } else {
          setState((s) => ({ ...s, durationMs: elapsed }));
        }
      }, 100);
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message }));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    cleanup();

    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      setState({
        isRecording: false,
        durationMs: status.durationMillis ?? 0,
        uri: uri ?? null,
        error: null,
      });
    } catch (err) {
      setState((s) => ({ ...s, isRecording: false, error: (err as Error).message }));
    }
  }, [cleanup]);

  const reset = useCallback(() => {
    setState({ isRecording: false, durationMs: 0, uri: null, error: null });
  }, []);

  return {
    isRecording: state.isRecording,
    durationMs: state.durationMs,
    durationSeconds: Math.floor(state.durationMs / 1000),
    remainingSeconds: Math.max(0, Math.floor((MAX_DURATION_MS - state.durationMs) / 1000)),
    uri: state.uri,
    error: state.error,
    startRecording,
    stopRecording,
    reset,
  };
}
