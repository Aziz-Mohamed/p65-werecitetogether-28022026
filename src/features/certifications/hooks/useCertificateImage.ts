import { useCallback, useRef, useState } from 'react';
import { Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import type { RefObject } from 'react';

/**
 * Hook for capturing a certificate component as an image and sharing it.
 * Uses react-native-view-shot to capture the offscreen CertificateImage component.
 */
export function useCertificateImage(viewRef: RefObject<any>) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const capture = useCallback(async (): Promise<string | null> => {
    if (!viewRef.current) return null;

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
