import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import { LanguageToggleButton } from '@/components/ui/LanguageToggleButton';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import type { UserRole } from '@/types/common.types';

// ─── Dev Login Config ──────────────────────────────────────────────────────

const DEV_PASSWORD = 'devpass123';

const DEV_ACCOUNTS: { role: UserRole; email: string; label: string; icon: string; color: string }[] = [
  { role: 'student', email: 'dev-student@werecitetogether.test', label: 'Student', icon: 'school', color: primary[500] },
  { role: 'teacher', email: 'dev-teacher@werecitetogether.test', label: 'Teacher', icon: 'person', color: accent.indigo[500] },
  { role: 'supervisor', email: 'dev-supervisor@werecitetogether.test', label: 'Supervisor', icon: 'eye', color: accent.violet[500] },
  { role: 'program_admin', email: 'dev-padmin@werecitetogether.test', label: 'Program Admin', icon: 'briefcase', color: accent.sky[500] },
  { role: 'master_admin', email: 'dev-madmin@werecitetogether.test', label: 'Master Admin', icon: 'shield', color: accent.rose[500] },
];

// ─── Screen ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signingInRole, setSigningInRole] = useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);

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

  const handleDevLogin = async (account: (typeof DEV_ACCOUNTS)[number]) => {
    try {
      setSigningInRole(account.role);
      setIsSigningIn(true);
      setErrorMessage(null);

      const result = await authService.signInWithPassword(
        account.email,
        DEV_PASSWORD,
      );

      if (result.error) {
        setErrorMessage(`${account.label}: ${result.error.message}`);
        return;
      }

      if (result.data) {
        setSession(result.data);
      }
    } catch {
      setErrorMessage(t('auth.signInFailed'));
    } finally {
      setIsSigningIn(false);
      setSigningInRole(null);
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

        {/* OAuth buttons — hidden in dev mode */}
        {!__DEV__ && (
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
        )}

        {/* Dev login pills — only in __DEV__ mode */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <View style={styles.devHeader}>
              <Ionicons name="code-slash" size={16} color={neutral[400]} />
              <Text style={styles.devLabel}>Dev Login</Text>
            </View>
            <View style={styles.devPills}>
              {DEV_ACCOUNTS.map((account) => (
                <Pressable
                  key={account.role}
                  style={({ pressed }) => [
                    styles.devPill,
                    { borderColor: account.color },
                    signingInRole === account.role && { backgroundColor: account.color },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleDevLogin(account)}
                  disabled={isSigningIn}
                >
                  <Ionicons
                    name={account.icon as any}
                    size={16}
                    color={signingInRole === account.role ? '#fff' : account.color}
                  />
                  <Text
                    style={[
                      styles.devPillText,
                      { color: signingInRole === account.role ? '#fff' : account.color },
                    ]}
                  >
                    {account.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
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
  // ─── Dev Login Styles ──────────────────────────────────────────
  devSection: {
    gap: spacing.md,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  devLabel: {
    ...typography.textStyles.label,
    color: neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  devPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  devPillText: {
    ...typography.textStyles.label,
    fontSize: normalize(13),
  },
});
