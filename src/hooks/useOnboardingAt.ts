import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_AT_KEY = 'app.onboardingAt';

export default function useOnboardingAt() {
  const [onboardingAt, setOnboardingAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ONBOARDING_AT_KEY);
        if (!mounted) return;
        setOnboardingAt(raw ? new Date(raw) : null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { onboardingAt, loading };
}
