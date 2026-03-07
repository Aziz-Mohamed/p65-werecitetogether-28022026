import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Heritage stickers are globally seeded — editing is no longer supported.
 * This route redirects back to the catalog.
 */
export default function EditStickerScreen() {
  const router = useRouter();

  useEffect(() => {
    router.back();
  }, [router]);

  return null;
}
