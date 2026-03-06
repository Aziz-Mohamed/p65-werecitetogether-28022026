import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Safe require — expo-av native module may not be available (e.g. Expo Go)
let Audio: typeof import('expo-av').Audio | null = null;
try {
  Audio = require('expo-av').Audio;
} catch {
  // Native module unavailable
}
import Slider from '@react-native-community/slider';
import { useVoiceMemoUrl } from '../hooks/useVoiceMemo';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface VoiceMemoPlayerProps {
  sessionId: string;
}

const SPEED_OPTIONS = [1, 1.25, 1.5] as const;

export function VoiceMemoPlayer({ sessionId }: VoiceMemoPlayerProps) {
  const { t } = useTranslation();
  const { data: memoUrl, isLoading } = useVoiceMemoUrl(sessionId);
  const soundRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const loadAndPlay = useCallback(async () => {
    if (!memoUrl?.url) return;

    if (!soundRef.current) {
      const { sound } = await Audio!.Sound.createAsync(
        { uri: memoUrl.url },
        { shouldPlay: true, rate: SPEED_OPTIONS[speedIndex] },
        (status) => {
          if (!status.isLoaded) return;
          setPositionMs(status.positionMillis ?? 0);
          setDurationMs(status.durationMillis ?? 0);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPositionMs(0);
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [memoUrl?.url, speedIndex]);

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync();
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      loadAndPlay();
    }
  }, [isPlaying, pause, loadAndPlay]);

  const handleSeek = useCallback(async (value: number) => {
    await soundRef.current?.setPositionAsync(value);
    setPositionMs(value);
  }, []);

  const handleSpeedToggle = useCallback(async () => {
    const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIndex);
    await soundRef.current?.setRateAsync(SPEED_OPTIONS[nextIndex], true);
  }, [speedIndex]);

  // Handle audio interruptions
  useEffect(() => {
    const handleInterruption = async (event: { type: string }) => {
      if (isPlaying) {
        await pause();
      }
    };

    // Audio interruption handling is managed by expo-av internally
    // When app goes to background, Audio.Sound pauses automatically
  }, [isPlaying, pause]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!Audio) {
    return (
      <View style={styles.expiredContainer}>
        <Ionicons name="mic-off-outline" size={20} color={colors.neutral[400]} />
        <Text style={styles.expiredText}>{t('voiceMemo.unavailablePlayback')}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  // Expired memo
  if (memoUrl?.is_expired) {
    const expiredDate = new Date(memoUrl.created_at).toLocaleDateString();
    const durationSecs = memoUrl.duration_seconds;
    return (
      <View style={styles.expiredContainer}>
        <Ionicons name="mic-off-outline" size={20} color={colors.neutral[400]} />
        <View>
          <Text style={styles.expiredText}>
            {t('voiceMemo.expiredWithDate', { date: expiredDate })}
          </Text>
          <Text style={styles.expiredMeta}>
            {formatTime(durationSecs * 1000)}
          </Text>
        </View>
      </View>
    );
  }

  if (!memoUrl?.url) return null;

  const totalDuration = durationMs || (memoUrl.duration_seconds * 1000);

  return (
    <View style={styles.container}>
      <View style={styles.playerRow}>
        {/* Play/Pause */}
        <Pressable
          style={styles.playButton}
          onPress={handlePlayPause}
          accessibilityLabel={isPlaying ? t('common.done') : t('voiceMemo.record')}
          accessibilityRole="button"
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={colors.white}
          />
        </Pressable>

        {/* Seek bar + time */}
        <View style={styles.seekContainer}>
          <Slider
            style={styles.slider}
            value={positionMs}
            minimumValue={0}
            maximumValue={totalDuration}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.primary[500]}
            maximumTrackTintColor={colors.neutral[200]}
            thumbTintColor={colors.primary[500]}
            accessibilityLabel={t('voiceMemo.playbackSpeed')}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>
        </View>

        {/* Speed toggle */}
        <Pressable
          style={styles.speedButton}
          onPress={handleSpeedToggle}
          accessibilityLabel={`${t('voiceMemo.speed')} ${SPEED_OPTIONS[speedIndex]}x`}
        >
          <Text style={styles.speedText}>{SPEED_OPTIONS[speedIndex]}x</Text>
        </Pressable>
      </View>

      {/* Available for notice */}
      {memoUrl && !memoUrl.is_expired && (
        <Text style={styles.availableText}>
          {t('voiceMemo.availableFor', {
            days: Math.max(0, Math.ceil((new Date(memoUrl.created_at).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))),
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  playButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekContainer: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: normalize(24),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  timeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(10),
    color: colors.neutral[400],
    fontVariant: ['tabular-nums'],
  },
  speedButton: {
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(8),
    backgroundColor: colors.neutral[200],
    borderRadius: radius.sm,
  },
  speedText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(11),
    color: colors.neutral[600],
  },
  loadingText: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.md,
  },
  expiredText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[500],
  },
  expiredMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(11),
    color: colors.neutral[400],
  },
  availableText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(11),
    color: colors.neutral[400],
    textAlign: 'center',
  },
});
