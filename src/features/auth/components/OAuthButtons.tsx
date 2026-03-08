import React from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useOAuthLogin } from '../hooks/useOAuthLogin';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import { typography } from '@/theme/typography';
import type { OAuthErrorCategory } from '../types/auth.types';

export const OAuthButtons: React.FC = () => {
  const { t } = useTranslation();
  const {
    signInWithGoogle,
    signInWithApple,
    isLoading,
    activeProvider,
    error,
  } = useOAuthLogin();

  const getErrorMessage = (category: OAuthErrorCategory): string => {
    const message = t(`auth.error.${category}`);
    return message || '';
  };

  return (
    <View style={styles.container}>
      {/* Google Sign-In Button */}
      <Pressable
        style={[styles.button, styles.googleButton]}
        onPress={signInWithGoogle}
        disabled={isLoading}
        accessibilityLabel={t('auth.continueWithGoogle')}
        accessibilityRole="button"
      >
        {activeProvider === 'google' ? (
          <ActivityIndicator size="small" color={lightTheme.text} />
        ) : (
          <Ionicons name="logo-google" size={20} color={lightTheme.text} />
        )}
        <Text style={[styles.buttonText, styles.googleText]}>
          {t('auth.continueWithGoogle')}
        </Text>
      </Pressable>

      {/* Apple Sign-In Button (iOS only) */}
      {Platform.OS === 'ios' && (
        <Pressable
          style={[styles.button, styles.appleButton]}
          onPress={signInWithApple}
          disabled={isLoading}
          accessibilityLabel={t('auth.continueWithApple')}
          accessibilityRole="button"
        >
          {activeProvider === 'apple' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
          )}
          <Text style={[styles.buttonText, styles.appleText]}>
            {t('auth.continueWithApple')}
          </Text>
        </Pressable>
      )}

      {/* Error display */}
      {error && error.category !== 'cancelled' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {getErrorMessage(error.category)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBlock: spacing.base,
    paddingInline: spacing.xl,
    borderRadius: radius.md,
    minHeight: normalize(48),
  },
  googleButton: {
    backgroundColor: lightTheme.surface,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  buttonText: {
    ...typography.textStyles.label,
  },
  googleText: {
    color: lightTheme.text,
  },
  appleText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: lightTheme.error + '20',
    paddingBlock: spacing.sm,
    paddingInline: spacing.base,
    borderRadius: radius.sm,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: lightTheme.error,
    textAlign: 'center',
  },
});
