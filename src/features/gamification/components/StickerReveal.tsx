import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useRTL } from '@/hooks/useRTL';
import { getStickerImageUrl } from '@/lib/storage';
import { colors, darkTheme, gamification } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { normalize } from '@/theme/normalize';
import type { AwardedSticker, StickerTier } from '../types/gamification.types';

// ─── Tier Glow Colors ─────────────────────────────────────────────────────────

const TIER_GLOW: Record<StickerTier, string> = {
  bronze: gamification.tierGlow.bronze,
  silver: gamification.tierGlow.silver,
  gold: gamification.tierGlow.gold,
  diamond: gamification.tierGlow.diamond,
  seasonal: colors.accent.violet[100],
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StickerRevealProps {
  sticker: AwardedSticker;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StickerReveal({ sticker, onDismiss }: StickerRevealProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const overlayOpacity = useSharedValue(0);
  const stickerScale = useSharedValue(0.3);
  const stickerOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  const tier = (sticker.stickers?.tier ?? 'bronze') as StickerTier;
  const glowColor = TIER_GLOW[tier] ?? colors.neutral[300];
  const name = isRTL
    ? sticker.stickers?.name_ar
    : sticker.stickers?.name_en;
  const imageUrl = sticker.stickers
    ? getStickerImageUrl(sticker.stickers.image_path)
    : undefined;

  const triggerHaptics = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    // Fade in overlay
    overlayOpacity.value = withTiming(1, { duration: 300 });

    // Glow pulse
    glowOpacity.value = withDelay(200, withTiming(0.6, { duration: 400 }));
    glowScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(1, { duration: 300 }),
      ),
    );

    // Sticker entrance
    stickerOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    stickerScale.value = withDelay(
      300,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 180 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      ),
    );

    // Text entrance
    textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );

    // Haptic feedback
    const timeout = setTimeout(() => runOnJS(triggerHaptics)(), 350);
    return () => clearTimeout(timeout);
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const stickerStyle = useAnimatedStyle(() => ({
    opacity: stickerOpacity.value,
    transform: [{ scale: stickerScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    stickerScale.value = withTiming(0.8, { duration: 200 });
    stickerOpacity.value = withTiming(0, { duration: 200 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    textOpacity.value = withTiming(0, { duration: 150 });

    setTimeout(onDismiss, 250);
  };

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Pressable style={styles.dismissArea} onPress={handleDismiss}>
        <View style={styles.content}>
          {/* Glow ring */}
          <Animated.View
            style={[styles.glow, { backgroundColor: glowColor }, glowStyle]}
          />

          {/* Sticker image */}
          <Animated.View style={[styles.stickerContainer, stickerStyle]}>
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.stickerImage}
                contentFit="contain"
                cachePolicy="disk"
              />
            )}
          </Animated.View>

          {/* Text */}
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text style={styles.congratsText}>
              {t('student.stickers.newSticker')}
            </Text>
            <Text style={styles.stickerName}>{name}</Text>
            <Text style={styles.tapHint}>
              {t('student.stickers.tapToDismiss')}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkTheme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dismissArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: normalize(200),
    height: normalize(200),
    borderRadius: normalize(100),
    opacity: 0.6,
  },
  stickerContainer: {
    width: normalize(140),
    height: normalize(140),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...shadows.xl,
  },
  stickerImage: {
    width: normalize(110),
    height: normalize(110),
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  congratsText: {
    ...typography.textStyles.label,
    color: colors.secondary[300],
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  stickerName: {
    ...typography.textStyles.subheading,
    color: colors.white,
    textAlign: 'center',
  },
  tapHint: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    marginTop: spacing.md,
  },
});
