import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

type PlaybackSpeed = 1 | 1.25 | 1.5;

interface AudioPlayerState {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  speed: PlaybackSpeed;
  error: string | null;
}

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    speed: 1,
    error: null,
  });

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const loadAndPlay = useCallback(async (uri: string) => {
    try {
      // Unload previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: state.speed },
        (status) => {
          if (status.isLoaded) {
            setState((s) => ({
              ...s,
              isPlaying: status.isPlaying,
              positionMs: status.positionMillis ?? 0,
              durationMs: status.durationMillis ?? 0,
            }));

            if (status.didJustFinish) {
              setState((s) => ({ ...s, isPlaying: false, positionMs: 0 }));
            }
          }
        },
      );

      soundRef.current = sound;
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message }));
    }
  }, [state.speed]);

  const play = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
    }
  }, []);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
    }
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(positionMs);
    }
  }, []);

  const setRate = useCallback(async (speed: PlaybackSpeed) => {
    setState((s) => ({ ...s, speed }));
    if (soundRef.current) {
      await soundRef.current.setRateAsync(speed, true);
    }
  }, []);

  return {
    isPlaying: state.isPlaying,
    positionMs: state.positionMs,
    durationMs: state.durationMs,
    speed: state.speed,
    error: state.error,
    loadAndPlay,
    play,
    pause,
    seek,
    setRate,
  };
}
