import './src/config/api';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import BottomNavigator from './src/navigation/BottomNavigator';
import {
  applyAuthHeaderFromKeychain,
  isTokenExpiredSecure,
  removeTokenSecure,
  hasTokenSecure,
  getTokenSecure,
} from './src/config/secureToken';
import { refreshWithStoredToken } from './src/services/auth.service';
import { HeaderProvider } from './src/context/HeaderProvider';

// Ăn
import {
  schedulePrePostRange,
  registerForegroundHandlers,
  registerBackgroundHandler,
  ensureNotificationReady,
} from './src/notifications/notifeeClient';

// Uống
import {
  registerHydrationForeground,
  registerHydrationBackground,
  bootstrapHydrationSchedule,
} from './src/notifications/hydrationAuto';
import { AuthProvider } from './src/context/AuthProvider';

// 🟢 Bắt buộc: đăng ký background handler ngoài component
registerBackgroundHandler();

function App() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // 🔐 Auth init
  useEffect(() => {
    (async () => {
      await applyAuthHeaderFromKeychain();

      if (__DEV__) {
        try {
          const t = await getTokenSecure();
          console.log('[AUTH DEBUG] TokenData at startup:', t);
        } catch (e) {
          console.log('[AUTH DEBUG] Cannot read token from Keychain:', e);
        }
      }

      let authed = await hasTokenSecure();
      if (authed) {
        try {
          const willExpire = await isTokenExpiredSecure();
          if (willExpire) await refreshWithStoredToken();
          authed = true;
        } catch (e: any) {
          const status = e?.response?.status ?? e?.status;
          if (status === 400 || status === 401) {
            await removeTokenSecure();
            authed = false;
          } else {
            authed = await hasTokenSecure();
          }
        }
      }
      setIsAuthed(authed);
      setReady(true);
    })();
  }, []);

  // 📱 Foreground handler
  useEffect(() => {
    const unsub = registerForegroundHandlers();
    return () => unsub?.();
  }, []);

  // 🔔 Lên lịch thật: báo 30' trước & 30' sau 3 bữa
  useEffect(() => {
    if (!ready) return;
    ensureNotificationReady()
      .then(() => schedulePrePostRange(7)) // đặt cho 7 ngày tới
      .catch(console.warn);
  }, [ready]);

  useEffect(() => {
    if (!ready || !isAuthed) return;

    const unsubFG = registerHydrationForeground(); // Đã uống
    const unsubBG = registerHydrationBackground();

    bootstrapHydrationSchedule(7).catch(console.log); // tự động lên lịch 7 ngày cho "uống nước"

    return () => {
      unsubFG && unsubFG();
    };
  }, [ready, isAuthed]);

  if (!ready) return null;

  return (
    <AuthProvider>
      <HeaderProvider>
        <NavigationContainer>
          {isAuthed ? <BottomNavigator /> : <AppNavigator />}
        </NavigationContainer>
      </HeaderProvider>
    </AuthProvider>
  );
}

export default App;
