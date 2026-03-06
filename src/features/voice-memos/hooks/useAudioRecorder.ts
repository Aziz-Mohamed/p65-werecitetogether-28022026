import { useState, useRef, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';

const MAX_DURATION_MS = 120_000; // 2 minutes
const METERING_UPDATE_MS = 100;

interface RecorderState {
  isRecording: boolean;
  durationMs: number;
  meteringLevels: number[];
  fileUri: string | null;
  permissionDenied: boolean;
}

export function useAudioRecorder() {
  const { t } = useTranslation();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    durationMs: 0,
    meteringLevels: [],
    fileUri: null,
    permissionDenied: false,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      setState((prev) => ({ ...prev, permissionDenied: true }));
      Alert.alert(
        t('voiceMemo.micPermissionDenied'),
        '',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('voiceMemo.openSettings'),
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return false;
    }
    setState((prev) => ({ ...prev, permissionDenied: false }));
    return true;
  }, [t]);

  const startRecording = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 22050,
        numberOfChannels: 1,
        bitRate: 64000,
      },
      ios: {
        extension: '.m4a',
        audioQuality: Audio.IOSAudioQuality.MEDIUM,
        sampleRate: 22050,
        numberOfChannels: 1,
        bitRate: 64000,
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      },
      web: {
        mimeType: 'audio/mp4',
        bitsPerSecond: 64000,
      },
      isMeteringEnabled: true,
    });

    recording.setOnRecordingStatusUpdate((status) => {
      if (!status.isRecording) return;

      const durationMs = status.durationMillis ?? 0;
      const metering = status.metering ?? -160;

      setState((prev) => ({
        ...prev,
        durationMs,
        meteringLevels: [...prev.meteringLevels.slice(-59), metering],
      }));

      // Auto-stop at max duration
      if (durationMs >= MAX_DURATION_MS) {
        stopRecording();
      }
    });

    recording.setProgressUpdateInterval(METERING_UPDATE_MS);
    await recording.startAsync();

    recordingRef.current = recording;
    setState((prev) => ({
      ...prev,
      isRecording: true,
      durationMs: 0,
      meteringLevels: [],
      fileUri: null,
    }));
  }, [requestPermission]);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setState((prev) => ({
        ...prev,
        isRecording: false,
        fileUri: uri,
      }));
    } catch {
      setState((prev) => ({ ...prev, isRecording: false }));
    }

    recordingRef.current = null;
  }, []);

  const cancelRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch {
      // Ignore errors during cancel
    }

    recordingRef.current = null;
    setState({
      isRecording: false,
      durationMs: 0,
      meteringLevels: [],
      fileUri: null,
      permissionDenied: false,
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
