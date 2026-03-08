import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { normalize } from '@/theme/normalize';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}

function Star({ index, filled, onPress, size }: { index: number; filled: boolean; onPress: () => void; size: number }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  const starNum = index + 1;

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.star, animatedStyle, { width: size, height: size }]}
      accessibilityLabel={starNum === 1 ? t('ratings.starLabel', { count: starNum }) : t('ratings.starsLabel', { count: starNum })}
      accessibilityRole="button"
      hitSlop={4}
    >
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size * 0.7}
        color={filled ? colors.accent.amber[400] : colors.neutral[300]}
      />
    </AnimatedPressable>
  );
}

export function StarRating({ value, onChange, size = normalize(44) }: StarRatingProps) {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          index={i}
          filled={i < value}
          onPress={() => onChange(i + 1)}
          size={size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(4),
  },
  star: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
