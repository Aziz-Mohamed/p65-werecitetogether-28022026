import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useVoiceMemoUrl } from '../hooks/useVoiceMemos';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

type PlaybackSpeed = 1 | 1.25 | 1.5;

interface VoiceMemoPlayerProps {
  storagePath: string;
  expiresAt: string;
}

const SPEEDS: PlaybackSpeed[] = [1, 1.25, 1.5];

export function VoiceMemoPlayer({ storagePath, expiresAt }: VoiceMemoPlayerProps) {
  const { t } = useTranslation();
  const { data: url } = useVoiceMemoUrl(storagePath);
  const player = useAudioPlayer();

  const isExpired = new Date(expiresAt) < new Date();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback(() => {
    if (!url) return;
    if (player.isPlaying) {
      player.pause();
    } else if (player.positionMs > 0) {
      player.play();
    } else {
      player.loadAndPlay(url);
    }
  }, [url, player]);

  if (isExpired) {
    return (
      <View style={styles.expiredContainer}>
        <Ionicons name="time-outline" size={20} color={neutral[400]} />
        <Text style={styles.expiredText}>{t('voiceMemos.expired')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Play/Pause */}
      <Pressable
        onPress={handlePlayPause}
        style={styles.playButton}
        accessibilityLabel={player.isPlaying ? t('voiceMemos.pause') : t('voiceMemos.play')}
        accessibilityRole="button"
      >
        <Ionicons
          name={player.isPlaying ? 'pause' : 'play'}
          size={20}
          color="#fff"
        />
      </Pressable>

      {/* Progress Bar & Time */}
      <View style={styles.seekContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${player.durationMs ? (player.positionMs / player.durationMs) * 100 : 0}%` },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(player.positionMs)}</Text>
          <Text style={styles.time}>{formatTime(player.durationMs)}</Text>
        </View>
      </View>

      {/* Speed Control */}
      <View style={styles.speedRow}>
        {SPEEDS.map((speed) => (
          <Pressable
            key={speed}
            onPress={() => player.setRate(speed)}
            style={[
              styles.speedChip,
              player.speed === speed && styles.speedChipActive,
            ]}
            accessibilityLabel={t(`voiceMemos.speed.${speed}x`)}
          >
            <Text
              style={[
                styles.speedText,
                player.speed === speed && styles.speedTextActive,
              ]}
            >
              {speed}x
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  playButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekContainer: {
    flex: 1,
  },
  progressTrack: {
    height: normalize(4),
    backgroundColor: neutral[200],
    borderRadius: normalize(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: primary[500],
    borderRadius: normalize(2),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...typography.textStyles.caption,
    color: neutral[400],
    fontSize: normalize(10),
  },
  speedRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  speedChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: neutral[200],
  },
  speedChipActive: {
    backgroundColor: primary[500],
    borderColor: primary[500],
  },
  speedText: {
    ...typography.textStyles.caption,
    color: neutral[500],
    fontSize: normalize(10),
  },
  speedTextActive: {
    color: '#fff',
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  expiredText: {
    ...typography.textStyles.caption,
    color: neutral[400],
  },
});
