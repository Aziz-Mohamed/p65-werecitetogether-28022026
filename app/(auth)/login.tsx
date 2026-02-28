import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import { LanguageToggleButton } from '@/components/ui/LanguageToggleButton';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

export default function LoginScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);

      // Get Google ID token using @react-native-google-signin/google-signin
      const { GoogleSignin } = await import(
        '@react-native-google-signin/google-signin'
      );
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        setErrorMessage(t('auth.signInFailed'));
        return;
      }

      const result = await authService.signInWithGoogle(idToken);
      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      if (result.data) {
        setSession(result.data);
      }
    } catch (error: any) {
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        setErrorMessage(t('auth.signInFailed'));
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);

      const AppleAuthentication = await import('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setErrorMessage(t('auth.signInFailed'));
        return;
      }

      const result = await authService.signInWithApple(
        credential.identityToken,
      );
      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      if (result.data) {
        setSession(result.data);
      }
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        setErrorMessage(t('auth.signInFailed'));
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <LanguageToggleButton />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/app-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>{t('auth.signInTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <Button
            title={t('auth.signInWithGoogle')}
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={isSigningIn}
            loading={isSigningIn}
            fullWidth
            icon={
              <Ionicons
                name="logo-google"
                size={20}
                color={lightTheme.text}
              />
            }
          />

          {Platform.OS === 'ios' && (
            <Button
              title={t('auth.signInWithApple')}
              onPress={handleAppleSignIn}
              variant="secondary"
              disabled={isSigningIn}
              loading={isSigningIn}
              fullWidth
              icon={
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color={lightTheme.text}
                />
              }
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBlockStart: spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBlockEnd: spacing.xl,
  },
  logo: {
    width: normalize(120),
    height: normalize(120),
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
    marginBlockEnd: spacing.xs,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginBlockEnd: spacing.xl,
  },
  errorContainer: {
    backgroundColor: lightTheme.error + '20',
    paddingBlock: spacing.sm,
    paddingInline: spacing.base,
    borderRadius: radius.sm,
    marginBlockEnd: spacing.base,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: lightTheme.error,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.md,
  },
});
