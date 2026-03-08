import { useRef, useState, useCallback } from 'react';
import { Share, Platform } from 'react-native';
import type Svg from 'react-native-svg';
import { File, Paths } from 'expo-file-system';

export function useShareJourneyMap() {
  const svgRef = useRef<Svg | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareJourneyMap = useCallback(async () => {
    if (!svgRef.current) return;
    setIsSharing(true);
    try {
      // 1. Convert SVG to base64 PNG via react-native-svg's built-in method
      const base64 = await new Promise<string>((resolve) => {
        svgRef.current!.toDataURL((data: string) => resolve(data));
      });

      // 2. Write base64 PNG to a temp file
      const file = new File(Paths.cache, 'quran-journey.png');
      file.write(base64, { encoding: 'base64' });

      // 3. Open native share sheet using RN's built-in Share API
      if (Platform.OS === 'ios') {
        await Share.share({ url: file.uri });
      } else {
        // Android: Share API supports content:// URIs via the file's contentUri
        await Share.share({ message: file.uri, title: 'My Quran Journey' });
      }
    } catch {
      // User cancelled share sheet — silently ignore
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { svgRef, isSharing, shareJourneyMap };
}
