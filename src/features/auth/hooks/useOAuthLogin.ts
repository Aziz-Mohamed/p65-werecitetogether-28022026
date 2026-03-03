import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { OAuthProvider, OAuthErrorCategory } from '../types/auth.types';

interface OAuthError {
  message: string;
  category: OAuthErrorCategory;
}

interface UseOAuthLoginReturn {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isLoading: boolean;
  activeProvider: OAuthProvider | null;
  error: OAuthError | null;
  clearError: () => void;
}

function categorizeError(error: unknown, provider: OAuthProvider): OAuthError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // User cancelled
    if (
      message.includes('cancel') ||
      message.includes('user denied') ||
      message.includes('sign_in_cancelled') ||
      message.includes('err_request_canceled')
    ) {
      return { message: '', category: 'cancelled' };
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('internet') ||
      message.includes('timeout') ||
      message.includes('offline')
    ) {
      return { message: error.message, category: 'network' };
    }

    // Provider errors
    if (
      message.includes('provider') ||
      message.includes('token') ||
      message.includes('invalid')
    ) {
      return { message: error.message, category: 'provider' };
    }
  }

  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    category: 'unknown',
  };
}

export const useOAuthLogin = (): UseOAuthLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<OAuthError | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setActiveProvider('google');
    setError(null);

    try {
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const response = await GoogleSignin.signIn();

      if (!response.data?.idToken) {
        throw new Error('No ID token returned from Google');
      }

      // Exchange the ID token with Supabase
      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data.session) {
        setSession(data.session);

        // Store avatar URL from Google if available
        const avatarUrl = data.user?.user_metadata?.picture;
        if (avatarUrl) {
          await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', data.user.id);
        }
      }
    } catch (err) {
      const oauthError = categorizeError(err, 'google');
      if (oauthError.category !== 'cancelled') {
        setError(oauthError);
      }
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  }, [setSession]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    setIsLoading(true);
    setActiveProvider('apple');
    setError(null);

    try {
      // Generate nonce for security
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }

      // Exchange the identity token with Supabase
      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data.session) {
        setSession(data.session);

        // Apple only provides name on first authorization — persist it
        if (credential.fullName?.givenName) {
          const fullName = [
            credential.fullName.givenName,
            credential.fullName.familyName,
          ]
            .filter(Boolean)
            .join(' ');

          if (fullName) {
            await supabase.auth.updateUser({
              data: { full_name: fullName },
            });

            // Also update the profile directly
            await supabase
              .from('profiles')
              .update({
                full_name: fullName,
                name_localized: { en: fullName },
              })
              .eq('id', data.user.id);
          }
        }
      }
    } catch (err) {
      const oauthError = categorizeError(err, 'apple');
      if (oauthError.category !== 'cancelled') {
        setError(oauthError);
      }
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  }, [setSession]);

  return {
    signInWithGoogle,
    signInWithApple,
    isLoading,
    activeProvider,
    error,
    clearError,
  };
};
