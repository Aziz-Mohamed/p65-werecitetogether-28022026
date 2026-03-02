import { useCallback, useState } from 'react';
import { Share, Platform, Alert } from 'react-native';
import type { RefObject } from 'react';

/**
 * Hook for capturing a certificate component as an image and sharing it.
 * Uses react-native-view-shot to capture the offscreen CertificateImage component.
 * Imports are lazy to avoid crashing when native module isn't built yet.
 */
export function useCertificateImage(viewRef: RefObject<any>) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const capture = useCallback(async (): Promise<string | null> => {
    if (!viewRef.current) return null;

    let captureRef: typeof import('react-native-view-shot').captureRef;
    let FileSystem: typeof import('expo-file-system/legacy');
    try {
      captureRef = require('react-native-view-shot').captureRef;
      FileSystem = require('expo-file-system/legacy');
    } catch {
      Alert.alert(
        'Rebuild Required',
        'Certificate sharing requires a dev client rebuild. Run: npx expo run:ios',
      );
      return null;
    }

    setIsCapturing(true);
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Cache the captured image
      const cacheDir = `${FileSystem.cacheDirectory}certificates/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const cachedPath = `${cacheDir}certificate_${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: cachedPath });

      setCapturedUri(cachedPath);
      return cachedPath;
    } finally {
      setIsCapturing(false);
    }
  }, [viewRef]);

  const share = useCallback(async () => {
    let uri = capturedUri;
    if (!uri) {
      uri = await capture();
    }
    if (!uri) return;

    await Share.share(
      Platform.OS === 'ios'
        ? { url: uri }
        : { message: uri },
    );
  }, [capturedUri, capture]);

  return { capture, share, isCapturing, capturedUri };
}
